import "server-only";
import { createInvitedAccount, findEmailRefusal } from "@features/accounts/lib/server/invitations";
import type { AdminPerson, StandFields } from "@features/stands/lib/stand-input";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation, readDatabaseMessage } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

type EmailRefusal = "emailTaken" | "hasPassport";

type Refusal = EmailRefusal | "standTaken" | "limitReached" | "adminExists" | "notFound";

export type CreateStandResult = { status: "created"; standId: string; emailId: string } | { status: Refusal };

export type UpdateStandResult = { status: "updated" | "notFound" | "standTaken" };

export type InviteStandAdminResult = { status: "invited"; emailId: string } | { status: Refusal };

interface Actor {
  id: string;
}

const ENTITY_STAND = "stand";

/**
 * Creates the stand and the invitation of its administrator in one transaction (RF-39). Both leave an entry in the
 * audit log inside it (RNF-11).
 */
export async function createStand(request: {
  actor: Actor;
  fields: StandFields;
  admin: AdminPerson;
  now: Date;
}): Promise<CreateStandResult> {
  const emailRefusal = await findEmailRefusal(request.admin.email);

  if (emailRefusal) return { status: emailRefusal.status === "hasPassport" ? "hasPassport" : "emailTaken" };

  try {
    return await getPrisma().$transaction((transaction) => createInTransaction(transaction, request));
  } catch (cause) {
    return explainCreateFailure({ cause, fields: request.fields });
  }
}

/** Changes the data of a stand. The accounts and the game stay with it, so the history of visits and votes stays too. */
export async function updateStand(request: {
  actor: Actor;
  standId: string;
  fields: StandFields;
}): Promise<UpdateStandResult> {
  const { actor, standId, fields } = request;

  try {
    return await getPrisma().$transaction(async (transaction): Promise<UpdateStandResult> => {
      const before = await transaction.stand.findUnique({ where: { id: standId } });

      if (!before) return { status: "notFound" };

      await transaction.stand.update({
        where: { id: standId },
        data: { zone: fields.zone, number: fields.number, studio: fields.studio, groupCode: fields.groupCode },
      });
      await recordAudit(transaction, {
        actorId: actor.id,
        action: "stand.update",
        entityType: ENTITY_STAND,
        entityId: standId,
        detail: { before: pickFields(before), after: { ...fields } },
      });

      return { status: "updated" };
    });
  } catch (cause) {
    if (isUniqueViolation(cause)) return { status: "standTaken" };

    throw cause;
  }
}

/** A stand whose administrator was disabled gets a new one; there is one active administrator per stand (RF-39). */
export async function inviteStandAdmin(request: {
  actor: Actor;
  standId: string;
  admin: AdminPerson;
  now: Date;
}): Promise<InviteStandAdminResult> {
  const { actor, standId, admin, now } = request;

  if (!(await getPrisma().stand.findUnique({ where: { id: standId }, select: { id: true } }))) {
    return { status: "notFound" };
  }

  const emailRefusal = await findEmailRefusal(admin.email);

  if (emailRefusal) return { status: emailRefusal.status === "hasPassport" ? "hasPassport" : "emailTaken" };

  try {
    return await getPrisma().$transaction(async (transaction): Promise<InviteStandAdminResult> => {
      const invited = await inviteAdminIn(transaction, { actorId: actor.id, standId, admin, now });

      return { status: "invited", emailId: invited.emailId };
    });
  } catch (cause) {
    if (readDatabaseMessage(cause).includes("ya tiene un administrador")) return { status: "adminExists" };

    if (isUniqueViolation(cause)) return { status: "emailTaken" };

    throw cause;
  }
}

async function createInTransaction(
  transaction: Prisma.TransactionClient,
  request: { actor: Actor; fields: StandFields; admin: AdminPerson; now: Date },
): Promise<CreateStandResult> {
  const { actor, fields, admin, now } = request;
  const stand = await transaction.stand.create({ data: fields, select: { id: true } });

  await recordAudit(transaction, {
    actorId: actor.id,
    action: "stand.create",
    entityType: ENTITY_STAND,
    entityId: stand.id,
    detail: { ...fields },
  });

  const invited = await inviteAdminIn(transaction, { actorId: actor.id, standId: stand.id, admin, now });

  return { status: "created", standId: stand.id, emailId: invited.emailId };
}

// The account, its invitation and its entry in the audit log; the audit detail never carries the email address.
async function inviteAdminIn(
  transaction: Prisma.TransactionClient,
  request: { actorId: string; standId: string; admin: AdminPerson; now: Date },
): Promise<{ emailId: string }> {
  const { actorId, standId, admin, now } = request;

  const invited = await createInvitedAccount(transaction, {
    name: admin.name,
    email: admin.email,
    role: "stand_admin",
    kofDesk: null,
    standId,
    createdById: actorId,
    now,
  });

  await recordAudit(transaction, {
    actorId,
    action: "account.invite",
    entityType: "account",
    entityId: invited.accountId,
    detail: { role: "stand_admin", kofDesk: null, standId },
  });

  return { emailId: invited.emailId };
}

// A repeated zone and number, or the limit of 18 stands that a trigger of the database enforces.
async function explainCreateFailure({
  cause,
  fields,
}: {
  cause: unknown;
  fields: StandFields;
}): Promise<CreateStandResult> {
  if (readDatabaseMessage(cause).includes("stands_limit_check")) return { status: "limitReached" };

  if (!isUniqueViolation(cause)) throw cause;

  const taken = await getPrisma().stand.findUnique({
    where: { zone_number: { zone: fields.zone, number: fields.number } },
    select: { id: true },
  });

  return { status: taken ? "standTaken" : "emailTaken" };
}

function pickFields(stand: { zone: string; number: number; studio: number; groupCode: string }) {
  return { zone: stand.zone, number: stand.number, studio: stand.studio, groupCode: stand.groupCode };
}
