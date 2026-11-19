import "server-only";
import { buildEntryEmail } from "@features/tournament/lib/entry-email";
import { getEntryWindow, type EntrySchedule } from "@features/tournament/lib/entries-rules";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";
import { generateTournament, type GenerateResult } from "@features/tournament/lib/server/tournament-mutations";
import { MAX_ENTRANTS, PRE_LIST_LIMIT } from "@features/tournament/lib/tournament-rules";
import type { EntryChannel, Player } from "@features/tournament/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation, readDatabaseMessage } from "@shared/lib/server/database-errors";
import { enqueueEmail, type OutgoingEmail } from "@shared/lib/server/email-outbox";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

const ENTITY_TYPE = "tournament_entry";

const PIN_FORMAT = /^\d{5}$/;

export type AddEntryResult =
  | { status: "added"; channel: EntryChannel; emailId: string }
  | { status: "notOpen"; opensAt: Date }
  | { status: "closed" }
  | { status: "unknownGamertag" }
  | { status: "alreadyEntered" }
  | { status: "preListFull" }
  | { status: "tournamentFull" };

export type CheckInResult =
  | { status: "checkedIn"; gamertag: string }
  | { status: "notOpen"; startsAt: Date }
  | { status: "closed" }
  | { status: "unknownPin" }
  | { status: "alreadyCheckedIn" }
  | { status: "noShow" };

interface NewEntry {
  visitorId: string;
  gamertag: string;
  email: string;
  channel: EntryChannel;
}

type Refusal = Extract<AddEntryResult, { status: "alreadyEntered" | "preListFull" | "tournamentFull" }>;

/**
 * Adds a visitor by gamertag. The hour decides the channel: a pre-registration until noon and an on-site entry, already
 * checked in, from noon to 12:45 (RF-58, RF-77). The table triggers are the safety net when two requests race. The
 * confirmation email (S8) is queued in the same transaction; the caller delivers `emailId` after the response.
 */
export async function addEntry(actorId: string, gamertag: string, now: Date): Promise<AddEntryResult> {
  const schedule = await getEntrySchedule();
  const window = getEntryWindow(schedule, now);

  if (window === "notOpen") return { status: "notOpen", opensAt: schedule.registrationOpensAt };

  if (window === "closed") return { status: "closed" };

  const visitor = await getPrisma().visitor.findFirst({
    where: { gamertag: gamertag.trim() },
    select: { id: true, gamertag: true, email: true },
  });

  if (!visitor) return { status: "unknownGamertag" };

  const entry = { visitorId: visitor.id, gamertag: visitor.gamertag, email: visitor.email, channel: window };

  return insertEntry(actorId, { entry, schedule }, now);
}

/** The administrator types the PIN of a pre-registered player; the player enters the bracket (RF-75). */
export async function checkInEntry(actorId: string, pin: string, now: Date): Promise<CheckInResult> {
  const schedule = await getEntrySchedule();

  if (now < schedule.checkInStartsAt) return { status: "notOpen", startsAt: schedule.checkInStartsAt };

  if (now >= schedule.checkInEndsAt) return { status: "closed" };

  const entry = await findEntryByPin(pin);

  if (!entry) return { status: "unknownPin" };

  if (entry.status === "checked_in") return { status: "alreadyCheckedIn" };

  if (entry.status === "no_show") return { status: "noShow" };

  return markCheckedIn(actorId, entry, now);
}

/** Generates the bracket with the players that checked in, after closing the check-in if it is due (RF-59). */
export async function generateFromEntries(actorId: string, now: Date): Promise<GenerateResult> {
  await closeCheckInIfDue(actorId, now);

  const entries = await getPrisma().tournamentEntry.findMany({
    where: { status: "checked_in" },
    orderBy: { createdAt: "asc" },
    select: { visitor: { select: { id: true, gamertag: true } } },
  });

  const players: Player[] = entries.map((entry) => ({ id: entry.visitor.id, tag: entry.visitor.gamertag }));

  return generateTournament(actorId, players, now);
}

/**
 * From the end of the check-in on, the entries that are still registered become "No se presentó" (RF-76). It can run any
 * number of times; it only writes the audit log when something changed. Returns how many entries it closed.
 */
export async function closeCheckInIfDue(actorId: string, now: Date): Promise<number> {
  const schedule = await getEntrySchedule();

  if (now < schedule.checkInEndsAt) return 0;

  return getPrisma().$transaction(async (transaction) => {
    const pending = await transaction.tournamentEntry.findMany({
      where: { status: "registered" },
      select: { id: true, visitorId: true },
    });

    const { count } = await transaction.tournamentEntry.updateMany({
      where: { id: { in: pending.map((entry) => entry.id) }, status: "registered" },
      data: { status: "no_show" },
    });

    if (count > 0) {
      await recordAudit(transaction, {
        actorId,
        action: "kof_entry.close_check_in",
        entityType: ENTITY_TYPE,
        entityId: "all",
        detail: { noShow: pending.map((entry) => entry.visitorId) },
      });
    }

    return count;
  });
}

async function insertEntry(
  actorId: string,
  { entry, schedule }: { entry: NewEntry; schedule: EntrySchedule },
  now: Date,
): Promise<AddEntryResult> {
  try {
    return await getPrisma().$transaction(async (transaction) => {
      const refusal = await findRefusal(transaction, entry);

      if (refusal) return refusal;

      const isOnsite = entry.channel === "onsite";

      const created = await transaction.tournamentEntry.create({
        data: {
          visitorId: entry.visitorId,
          channel: entry.channel,
          status: isOnsite ? "checked_in" : "registered",
          checkedInAt: isOnsite ? now : null,
          registeredById: actorId,
        },
      });

      await recordAudit(transaction, {
        actorId,
        action: "kof_entry.add",
        entityType: ENTITY_TYPE,
        entityId: created.id,
        detail: { visitorId: entry.visitorId, gamertag: entry.gamertag, channel: entry.channel },
      });

      const emailId = await enqueueEntryEmail(transaction, {
        entryId: created.id,
        email: buildEntryEmail({ to: entry.email, gamertag: entry.gamertag, channel: entry.channel, schedule }),
      });

      return { status: "added", channel: entry.channel, emailId };
    });
  } catch (cause) {
    return explainInsertFailure(cause);
  }
}

/** The confirmation of an entry whose first email was abandoned; null when the entry no longer exists. */
export async function rebuildEntryEmail(
  transaction: Prisma.TransactionClient,
  entryId: string,
): Promise<string | null> {
  const entry = await transaction.tournamentEntry.findUnique({
    where: { id: entryId },
    select: { channel: true, visitor: { select: { gamertag: true, email: true } } },
  });

  if (!entry) return null;

  const { gamertag, email: to } = entry.visitor;
  const channel: EntryChannel = entry.channel === "onsite" ? "onsite" : "pre";
  const schedule = await getEntrySchedule(transaction);

  return enqueueEntryEmail(transaction, { entryId, email: buildEntryEmail({ to, gamertag, channel, schedule }) });
}

function enqueueEntryEmail(
  transaction: Prisma.TransactionClient,
  { entryId, email }: { entryId: string; email: OutgoingEmail },
): Promise<string> {
  return enqueueEmail(transaction, email, { kind: "kof_entry", referenceId: entryId });
}

async function findRefusal(transaction: Prisma.TransactionClient, entry: NewEntry): Promise<Refusal | null> {
  if (await transaction.tournamentEntry.findUnique({ where: { visitorId: entry.visitorId } })) {
    return { status: "alreadyEntered" };
  }

  if (
    entry.channel === "pre" &&
    (await transaction.tournamentEntry.count({ where: { channel: "pre" } })) >= PRE_LIST_LIMIT
  ) {
    return { status: "preListFull" };
  }

  const places = await transaction.tournamentEntry.count({ where: { status: { not: "no_show" } } });

  return places >= MAX_ENTRANTS ? { status: "tournamentFull" } : null;
}

// Two requests can pass the counts together; the triggers of the table stop the second and this names the reason.
export function explainInsertFailure(cause: unknown): Refusal {
  const message = readDatabaseMessage(cause);

  if (message.includes("Torneo lleno")) return { status: "tournamentFull" };

  if (message.includes("Lista previa llena")) return { status: "preListFull" };

  if (isUniqueViolation(cause)) return { status: "alreadyEntered" };

  throw cause;
}

async function findEntryByPin(pin: string) {
  if (!PIN_FORMAT.test(pin)) return null;

  return getPrisma().tournamentEntry.findFirst({
    where: { visitor: { pinLookup: hashPinForLookup(pin) } },
    select: { id: true, status: true, visitor: { select: { gamertag: true } } },
  });
}

async function markCheckedIn(
  actorId: string,
  entry: { id: string; visitor: { gamertag: string } },
  now: Date,
): Promise<CheckInResult> {
  return getPrisma().$transaction(async (transaction) => {
    const { count } = await transaction.tournamentEntry.updateMany({
      where: { id: entry.id, status: "registered" },
      data: { status: "checked_in", checkedInAt: now },
    });

    if (count === 0) return { status: "alreadyCheckedIn" };

    await recordAudit(transaction, {
      actorId,
      action: "kof_entry.check_in",
      entityType: ENTITY_TYPE,
      entityId: entry.id,
      detail: { gamertag: entry.visitor.gamertag },
    });

    return { status: "checkedIn", gamertag: entry.visitor.gamertag };
  });
}
