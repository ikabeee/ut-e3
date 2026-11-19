import "server-only";
import { MAX_STAND_STAFF } from "@features/accounts/lib/invitation-rules";
import {
  countStandStaff,
  createInvitedAccount,
  findEmailRefusal,
  hasStandAdmin,
  isDeskTaken,
} from "@features/accounts/lib/server/invitations";
import {
  formatStand,
  parseStaffInvitationCsv,
  type StaffInvitationRow,
} from "@features/accounts/lib/staff-invitation-csv";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

/** The audit entry that marks the bulk invitation as done: its presence is what makes the next start do nothing (T9). */
export const STAFF_BULK_INVITE_ACTION = "staff.bulk_invite";

/** The event has at most this many stands; a trigger of the table (`stands_limit_check`) refuses one more. */
const MAX_EVENT_STANDS = 18;

// Around 70 accounts, each with its invitation, email and audit entry: far over the default 5 seconds of Prisma on a slow disk.
const TRANSACTION_TIMEOUT_MS = 60_000;

/** A stand of the event as the script receives it (`INITIAL_STANDS`); accounts cannot import the games feature. */
export interface StandSlot {
  zone: string;
  number: number;
  studio: number;
  groupCode: string;
}

export interface BulkInviteRequest {
  /** Read only when the run has not been done yet, so a restart does not need the file. */
  readCsv: () => string;
  stands: readonly StandSlot[];
  now: Date;
}

/** `line` is null for what is about the whole list and not one row. */
export interface BulkInviteProblem {
  line: number | null;
  message: string;
}

export type BulkInviteResult =
  | { status: "alreadyDone" }
  | { status: "invalid"; errors: BulkInviteProblem[] }
  | {
      status: "done";
      createdStands: number;
      invited: number;
      skippedLines: number[];
      omitted: { line: number; name: string }[];
    };

interface PlannedAccount {
  row: StaffInvitationRow;
  /** The stand of a stand role; null for the other roles. */
  slot: StandSlot | null;
  /** The stand as the list writes it (`101-5`), for the messages. */
  standLabel: string | null;
}

interface Plan {
  newStands: StandSlot[];
  /** The id of each stand that exists already, by zone and number. */
  standIds: Map<string, string>;
  toInvite: PlannedAccount[];
  skippedLines: number[];
}

type Planning = { kind: "planned"; plan: Plan } | { kind: "invalid"; errors: BulkInviteProblem[] };

/**
 * Creates the stands of the event that are missing and one invited account for each person of the list whose email has
 * no account, in one transaction, so a run writes everything or nothing. The emails stay queued in the outbox for the
 * throttled worker: nothing is sent from here. It runs once: the entry `staff.bulk_invite` that it leaves in the audit
 * log makes every later call return `alreadyDone` without reading the list, even if the list changed (T9).
 *
 * The actor is the system, not a person: the accounts have no `createdById` and the audit entries no `actorId`, which is
 * what both columns already mean when no staff account made the change (RF-74, a visitor's own recovery). Choosing the
 * first sysadmin would put the name of someone who did not act in the audit log.
 */
export async function inviteStaffFromCsv(request: BulkInviteRequest): Promise<BulkInviteResult> {
  if (await hasRun()) return { status: "alreadyDone" };

  const parsed = parseStaffInvitationCsv(request.readCsv());

  if (parsed.errors.length > 0) return { status: "invalid", errors: parsed.errors };

  const planning = await planBulkInvite(parsed.rows, request.stands);

  if (planning.kind === "invalid") return { status: "invalid", errors: planning.errors };

  const { plan } = planning;

  await getPrisma().$transaction(
    (transaction) => writePlan(transaction, { plan, omitted: parsed.omitted.length, now: request.now }),
    { timeout: TRANSACTION_TIMEOUT_MS },
  );

  return {
    status: "done",
    createdStands: plan.newStands.length,
    invited: plan.toInvite.length,
    skippedLines: plan.skippedLines,
    omitted: parsed.omitted,
  };
}

async function hasRun(): Promise<boolean> {
  const entry = await getPrisma().auditLog.findFirst({
    where: { action: STAFF_BULK_INVITE_ACTION },
    select: { id: true },
  });

  return entry !== null;
}

// Everything that the database can refuse is checked here, before the first write, and reported together.
async function planBulkInvite(rows: StaffInvitationRow[], stands: readonly StandSlot[]): Promise<Planning> {
  const resolved = resolveStands(rows, stands);
  const classified = await classifyEmails(resolved.planned);
  const existing = await getExistingStands();
  const newStands = stands.filter((slot) => !existing.has(standKey(slot)));

  const errors = [
    ...resolved.errors,
    ...classified.errors,
    ...findStandCountProblem(existing.size, newStands.length),
    ...(await findLimitProblems(classified.toInvite, existing)),
  ];

  if (errors.length > 0) return { kind: "invalid", errors: sortProblems(errors) };

  const { toInvite, skippedLines } = classified;

  return { kind: "planned", plan: { newStands, standIds: existing, toInvite, skippedLines } };
}

interface ResolvedStands {
  planned: PlannedAccount[];
  errors: BulkInviteProblem[];
}

function resolveStands(rows: StaffInvitationRow[], stands: readonly StandSlot[]): ResolvedStands {
  const planned: PlannedAccount[] = [];
  const errors: BulkInviteProblem[] = [];

  for (const row of rows) {
    const slot = row.stand
      ? stands.find(
          (candidate) => candidate.groupCode === row.stand?.groupCode && candidate.studio === row.stand.studio,
        )
      : undefined;

    if (row.stand && !slot) {
      errors.push({ line: row.line, message: `El stand ${formatStand(row.stand)} no es uno de los stands del evento` });
    } else {
      planned.push({ row, slot: slot ?? null, standLabel: row.stand ? formatStand(row.stand) : null });
    }
  }

  return { planned, errors };
}

// An email with an account is skipped and reported (the run is idempotent); one with a passport cannot be staff (RN-02).
interface ClassifiedEmails {
  toInvite: PlannedAccount[];
  skippedLines: number[];
  errors: BulkInviteProblem[];
}

async function classifyEmails(planned: PlannedAccount[]): Promise<ClassifiedEmails> {
  const toInvite: PlannedAccount[] = [];
  const skippedLines: number[] = [];
  const errors: BulkInviteProblem[] = [];

  for (const account of planned) {
    const refusal = await findEmailRefusal(account.row.email);

    if (refusal === null) toInvite.push(account);
    else if (refusal.status === "emailTaken") skippedLines.push(account.row.line);
    else errors.push({ line: account.row.line, message: "El correo ya tiene un pasaporte de visitante" });
  }

  return { toInvite, skippedLines, errors };
}

async function getExistingStands(): Promise<Map<string, string>> {
  const stands = await getPrisma().stand.findMany({ select: { id: true, zone: true, number: true } });

  return new Map(stands.map((stand) => [standKey(stand), stand.id]));
}

function standKey(stand: { zone: string; number: number }): string {
  return `${stand.zone}-${stand.number}`;
}

function findStandCountProblem(existing: number, missing: number): BulkInviteProblem[] {
  if (existing + missing <= MAX_EVENT_STANDS) return [];

  return [
    {
      line: null,
      message: `El evento admite ${MAX_EVENT_STANDS} stands: hay ${existing} y la lista crearía ${missing} más`,
    },
  ];
}

// The limits that the triggers of the table enforce, checked against what the database already has plus the list.
async function findLimitProblems(
  toInvite: PlannedAccount[],
  existing: Map<string, string>,
): Promise<BulkInviteProblem[]> {
  const problems: BulkInviteProblem[] = [];

  for (const { row, slot, standLabel } of toInvite) {
    const standId = slot ? existing.get(standKey(slot)) : undefined;

    if (row.role === "stand_admin" && standId && (await hasStandAdmin(standId))) {
      problems.push({ line: row.line, message: `El stand ${standLabel} ya tiene administrador` });
    }

    if (row.kofDesk !== null && (await isDeskTaken(row.kofDesk))) {
      problems.push({ line: row.line, message: `La mesa ${row.kofDesk} ya tiene staff` });
    }
  }

  return [...problems, ...(await findStaffOverflow(toInvite, existing))];
}

async function findStaffOverflow(
  toInvite: PlannedAccount[],
  existing: Map<string, string>,
): Promise<BulkInviteProblem[]> {
  const problems: BulkInviteProblem[] = [];

  for (const [key, staff] of groupStaffByStand(toInvite)) {
    const standId = existing.get(key);
    const current = standId ? await countStandStaff(standId) : 0;

    if (current + staff.length > MAX_STAND_STAFF) {
      problems.push({
        line: staff[0].row.line,
        message: `El stand ${staff[0].standLabel} tiene ${current} staff y se agregarían ${staff.length} (máximo ${MAX_STAND_STAFF})`,
      });
    }
  }

  return problems;
}

function groupStaffByStand(toInvite: PlannedAccount[]): Map<string, PlannedAccount[]> {
  const groups = new Map<string, PlannedAccount[]>();

  for (const account of toInvite) {
    if (account.row.role !== "stand_staff" || !account.slot) continue;

    const key = standKey(account.slot);

    groups.set(key, [...(groups.get(key) ?? []), account]);
  }

  return groups;
}

function sortProblems(problems: BulkInviteProblem[]): BulkInviteProblem[] {
  const rank = (problem: BulkInviteProblem) => problem.line ?? Number.MAX_SAFE_INTEGER;

  return [...problems].sort((a, b) => rank(a) - rank(b));
}

async function writePlan(
  transaction: Prisma.TransactionClient,
  run: { plan: Plan; omitted: number; now: Date },
): Promise<void> {
  const { plan, omitted, now } = run;
  const standIds = new Map(plan.standIds);

  for (const slot of plan.newStands) standIds.set(standKey(slot), await createStand(transaction, slot));

  for (const { row, slot } of plan.toInvite) {
    await inviteAccount(transaction, { row, standId: slot ? (standIds.get(standKey(slot)) ?? null) : null, now });
  }

  await recordAudit(transaction, {
    actorId: null,
    action: STAFF_BULK_INVITE_ACTION,
    entityType: "staff_invitations",
    entityId: "bulk",
    detail: {
      createdStands: plan.newStands.length,
      invited: plan.toInvite.length,
      skipped: plan.skippedLines.length,
      omitted,
    },
  });
}

async function createStand(transaction: Prisma.TransactionClient, slot: StandSlot): Promise<string> {
  const stand = await transaction.stand.create({
    data: { zone: slot.zone, number: slot.number, studio: slot.studio, groupCode: slot.groupCode },
    select: { id: true },
  });

  await recordAudit(transaction, {
    actorId: null,
    action: "stand.create",
    entityType: "stand",
    entityId: stand.id,
    detail: { zone: slot.zone, number: slot.number, studio: slot.studio, groupCode: slot.groupCode },
  });

  return stand.id;
}

// The account, its link of 72 hours and its queued email come from the same function as every other invitation; the
// audit entry carries no email address.
async function inviteAccount(
  transaction: Prisma.TransactionClient,
  invitation: { row: StaffInvitationRow; standId: string | null; now: Date },
): Promise<void> {
  const { row, standId, now } = invitation;

  const { accountId } = await createInvitedAccount(transaction, {
    name: row.name,
    email: row.email,
    role: row.role,
    secondaryRole: row.secondaryRole,
    kofDesk: row.kofDesk,
    standId,
    createdById: null,
    now,
  });

  await recordAudit(transaction, {
    actorId: null,
    action: "account.invite",
    entityType: "account",
    entityId: accountId,
    detail: { role: row.role, secondaryRole: row.secondaryRole, kofDesk: row.kofDesk, standId },
  });
}
