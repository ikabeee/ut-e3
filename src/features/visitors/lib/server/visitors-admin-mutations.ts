import "server-only";

import type { ValidRegistrationInput } from "@features/visitors/lib/registration-input";
import { issueEmailLink } from "@features/visitors/lib/server/email-recovery";
import {
  enqueuePassportEmail,
  isPrismaUniqueViolation,
  mapUniqueViolation,
} from "@features/visitors/lib/server/visitor-registration";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { decryptPin } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export type ResendPassportResult = { status: "queued"; emailId: string } | { status: "notFound" | "pinUnreadable" };

export type RecoveryLinkResult = { status: "queued"; emailId: string } | { status: "notFound" };

export type UpdateVisitorResult =
  { status: "updated" } | { status: "notFound" | "unchanged" | "emailBlocked" | "emailTaken" | "gamertagTaken" };

type EditableField = keyof ValidRegistrationInput;

type VisitorSnapshot = { id: string } & ValidRegistrationInput;

/**
 * Queues the registration email again, with the PIN decrypted from the passport, to the email it has now. The audit
 * entry says who asked and for whom; it never carries the PIN. The caller starts the delivery after answering.
 */
export async function resendPassportEmail(actorId: string, visitorId: string): Promise<ResendPassportResult> {
  return getPrisma().$transaction(async (transaction): Promise<ResendPassportResult> => {
    const visitor = await transaction.visitor.findUnique({
      where: { id: visitorId },
      select: { id: true, gamertag: true, email: true, pin: true },
    });

    if (!visitor) return { status: "notFound" };

    const pin = readPin(visitor.pin);

    if (pin === null) return { status: "pinUnreadable" };

    const emailId = await enqueuePassportEmail(transaction, {
      visitorId: visitor.id,
      email: visitor.email,
      gamertag: visitor.gamertag,
      pin,
    });

    await recordAudit(transaction, {
      actorId,
      action: "visitor.passport_resent",
      entityType: "visitor",
      entityId: visitor.id,
      detail: { emailId },
    });

    return { status: "queued", emailId };
  });
}

/**
 * Queues a recovery link for the passport. The sysadmin is not held to the 3-per-hour limit of the self-service request:
 * that limit stops anyone from flooding an inbox by typing its address, and this action is signed in and audited.
 */
export async function sendRecoveryLink(actorId: string, visitorId: string, now: Date): Promise<RecoveryLinkResult> {
  return getPrisma().$transaction(async (transaction): Promise<RecoveryLinkResult> => {
    const visitor = await transaction.visitor.findUnique({
      where: { id: visitorId },
      select: { id: true, email: true },
    });

    if (!visitor) return { status: "notFound" };

    return { status: "queued", emailId: await issueEmailLink(transaction, visitor, { now, actorId }) };
  });
}

/**
 * Corrects the name, gamertag and email of a passport. The PIN is untouched, so the filter of the kiosks (built from
 * PINs only) stays valid. The email must be free: not on the blocklist, not a staff account, not another passport's.
 */
export async function updateVisitorData(
  actorId: string,
  visitorId: string,
  input: ValidRegistrationInput,
): Promise<UpdateVisitorResult> {
  try {
    return await getPrisma().$transaction((transaction) =>
      applyVisitorUpdate(transaction, { actorId, visitorId, input }),
    );
  } catch (cause) {
    const taken = isPrismaUniqueViolation(cause) ? mapUniqueViolation(cause.meta?.target) : null;

    if (taken?.status === "gamertagTaken") return taken;

    if (taken?.status === "blocked") return { status: "emailTaken" };

    throw cause;
  }
}

async function applyVisitorUpdate(
  transaction: Prisma.TransactionClient,
  request: { actorId: string; visitorId: string; input: ValidRegistrationInput },
): Promise<UpdateVisitorResult> {
  const { actorId, visitorId, input } = request;

  const visitor = await transaction.visitor.findUnique({
    where: { id: visitorId },
    select: { id: true, fullName: true, gamertag: true, email: true },
  });

  if (!visitor) return { status: "notFound" };

  const fields = listChangedFields(visitor, input);

  if (fields.length === 0) return { status: "unchanged" };

  const refusal = await findRefusal(transaction, { visitor, fields, input });

  if (refusal) return { status: refusal };

  await transaction.visitor.update({ where: { id: visitor.id }, data: input });

  // A recovery link already sent to the old address must not keep working after the address was corrected.
  if (fields.includes("email")) {
    await transaction.recoveryToken.updateMany({
      where: { visitorId: visitor.id, channel: "email", usedAt: null },
      data: { expiresAt: new Date() },
    });
  }

  await recordAudit(transaction, {
    actorId,
    action: "visitor.update",
    entityType: "visitor",
    entityId: visitor.id,
    detail: buildUpdateDetail(visitor, fields, input),
  });

  return { status: "updated" };
}

// Only the names of the fields and the gamertag (public in the bracket): the audit log keeps no email or name.
function buildUpdateDetail(
  visitor: VisitorSnapshot,
  fields: EditableField[],
  input: ValidRegistrationInput,
): Prisma.InputJsonValue {
  if (!fields.includes("gamertag")) return { fields };

  return { fields, gamertag: { from: visitor.gamertag, to: input.gamertag } };
}

function listChangedFields(visitor: VisitorSnapshot, input: ValidRegistrationInput): EditableField[] {
  const changed: EditableField[] = [];

  if (visitor.fullName !== input.fullName) changed.push("fullName");

  if (visitor.gamertag !== input.gamertag) changed.push("gamertag");

  // visitors.email compares without case, and the form lowercases what it reads.
  if (visitor.email.toLowerCase() !== input.email) changed.push("email");

  return changed;
}

async function findRefusal(
  transaction: Prisma.TransactionClient,
  change: { visitor: VisitorSnapshot; fields: EditableField[]; input: ValidRegistrationInput },
): Promise<"emailBlocked" | "emailTaken" | "gamertagTaken" | null> {
  const { visitor, fields, input } = change;

  if (fields.includes("gamertag") && (await isGamertagUsedByAnother(transaction, visitor.id, input.gamertag))) {
    return "gamertagTaken";
  }

  if (!fields.includes("email")) return null;

  return findEmailRefusal(transaction, visitor.id, input.email);
}

async function isGamertagUsedByAnother(
  transaction: Prisma.TransactionClient,
  visitorId: string,
  gamertag: string,
): Promise<boolean> {
  const other = await transaction.visitor.findFirst({
    where: { gamertag, id: { not: visitorId } },
    select: { id: true },
  });

  return other !== null;
}

// email_blocklist and visitors compare without case; accounts store their email lowercased.
async function findEmailRefusal(
  transaction: Prisma.TransactionClient,
  visitorId: string,
  email: string,
): Promise<"emailBlocked" | "emailTaken" | null> {
  const [blocked, account, other] = await Promise.all([
    transaction.emailBlocklist.findFirst({ where: { email }, select: { email: true } }),
    transaction.account.findFirst({ where: { email }, select: { id: true } }),
    transaction.visitor.findFirst({ where: { email, id: { not: visitorId } }, select: { id: true } }),
  ]);

  if (blocked || account) return "emailBlocked";

  return other ? "emailTaken" : null;
}

function readPin(encrypted: string): string | null {
  try {
    return decryptPin(encrypted);
  } catch {
    return null;
  }
}
