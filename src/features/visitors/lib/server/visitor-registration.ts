import "server-only";

import { randomInt } from "node:crypto";
import type { ValidRegistrationInput } from "@features/visitors/lib/registration-input";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";
import { siteConfig } from "@shared/lib/site-config";

export type RegistrationResult =
  | { status: "blocked" }
  | { status: "gamertagTaken" }
  | { status: "created"; visitorId: string; deviceToken: string; emailId: string };

interface GeneratedPin {
  pin: string;
  pinLookup: string;
  encryptedPin: string;
}

export async function registerVisitorRecord(
  input: ValidRegistrationInput,
  now: Date = new Date(),
): Promise<RegistrationResult> {
  return getPrisma().$transaction(async (tx) => {
    if (await isEmailBlocked(tx, input.email)) {
      return { status: "blocked" };
    }

    if (await isGamertagTaken(tx, input.gamertag)) {
      return { status: "gamertagTaken" };
    }

    return insertVisitorRegistration(tx, input, now);
  });
}

export async function getRegistrationOpensAt(): Promise<Date | null> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { registrationOpensAt: true },
  });

  return settings?.registrationOpensAt ?? null;
}

// visitors and email_blocklist compare with COLLATE NOCASE; accounts store their email lowercased.
async function isEmailBlocked(tx: Prisma.TransactionClient, email: string): Promise<boolean> {
  const [blocked, account, existingVisitor] = await Promise.all([
    tx.emailBlocklist.findFirst({ where: { email } }),
    tx.account.findFirst({ where: { email: email.toLowerCase() } }),
    tx.visitor.findFirst({ where: { email } }),
  ]);

  return Boolean(blocked || account || existingVisitor);
}

async function isGamertagTaken(tx: Prisma.TransactionClient, gamertag: string): Promise<boolean> {
  const existing = await tx.visitor.findFirst({ where: { gamertag } });

  return Boolean(existing);
}

async function insertVisitorRegistration(
  tx: Prisma.TransactionClient,
  input: ValidRegistrationInput,
  now: Date,
): Promise<RegistrationResult> {
  const { pin, pinLookup, encryptedPin } = await generateUniquePin(tx);

  const visitor = await tx.visitor.create({
    data: {
      fullName: input.fullName,
      gamertag: input.gamertag,
      email: input.email,
      pin: encryptedPin,
      pinLookup,
      createdAt: now,
    },
  });

  const deviceToken = await createVisitorDevice(tx, visitor.id);
  const passportUrl = `${siteConfig.url}${PASSPORT_PATH}`;

  const emailId = await enqueueEmail(tx, {
    to: input.email,
    subject: VISITORS_COPY.email.subject(input.gamertag),
    text: VISITORS_COPY.email.body(pin, input.gamertag, passportUrl),
  });

  await recordVisitorAudit(tx, visitor.id, input.gamertag);

  return {
    status: "created",
    visitorId: visitor.id,
    deviceToken,
    emailId,
  };
}

async function generateUniquePin(tx: Prisma.TransactionClient): Promise<GeneratedPin> {
  while (true) {
    const rawPin = String(randomInt(0, 100_000)).padStart(5, "0");
    const pinLookup = hashPinForLookup(rawPin);

    const collision = await tx.visitor.findUnique({
      where: { pinLookup },
      select: { id: true },
    });

    if (!collision) {
      const encryptedPin = encryptPin(rawPin);

      return { pin: rawPin, pinLookup, encryptedPin };
    }
  }
}

async function recordVisitorAudit(tx: Prisma.TransactionClient, visitorId: string, gamertag: string): Promise<void> {
  // SAFETY: recordAudit delegates to Prisma where actorId is optional.
  const recordRegistrationAudit = recordAudit as (
    transaction: Prisma.TransactionClient,
    entry: {
      actorId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      detail: Prisma.InputJsonValue;
    },
  ) => Promise<void>;

  await recordRegistrationAudit(tx, {
    actorId: null,
    action: "visitor.register",
    entityType: "visitor",
    entityId: visitorId,
    detail: { gamertag },
  });
}
