import "server-only";

import { randomInt } from "node:crypto";
import type { ValidRegistrationInput } from "@features/visitors/lib/registration-input";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";
import { siteConfig } from "@shared/lib/site-config";

export const MAX_PIN_ATTEMPTS = 20;

export type RandomPinSource = () => number | string;

export type RegistrationResult =
  | { status: "blocked" }
  | { status: "gamertagTaken" }
  | { status: "created"; visitorId: string; deviceToken: string; emailId: string };

export type UniqueViolationTarget = string[] | string | null | undefined;

export type UniqueViolationResolution =
  { status: "gamertagTaken" } | { status: "blocked" } | { status: "retryPin" } | null;

interface GeneratedPin {
  pin: string;
  pinLookup: string;
  encryptedPin: string;
}

interface PrismaUniqueError extends Prisma.PrismaClientKnownRequestError {
  meta?: { target?: UniqueViolationTarget };
}

type InsertAttemptOutcome = { kind: "completed"; result: RegistrationResult } | { kind: "retry" };

export async function registerVisitorRecord(
  input: ValidRegistrationInput,
  now: Date = new Date(),
): Promise<RegistrationResult> {
  try {
    return await getPrisma().$transaction(async (tx) => {
      if (await isEmailBlocked(tx, input.email)) {
        return { status: "blocked" };
      }

      if (await isGamertagTaken(tx, input.gamertag)) {
        return { status: "gamertagTaken" };
      }

      return insertVisitorRegistration(tx, input, now);
    });
  } catch (cause) {
    if (isPrismaUniqueViolation(cause)) {
      const resolution = mapUniqueViolation(cause.meta?.target);

      if (resolution && resolution.status !== "retryPin") {
        return resolution;
      }
    }

    throw cause;
  }
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
  for (let attempt = 1; attempt <= MAX_PIN_ATTEMPTS; attempt++) {
    const outcome = await attemptVisitorInsert(tx, input, now);

    if (outcome.kind === "retry") {
      continue;
    }

    return outcome.result;
  }

  throw new Error("Unable to generate a unique PIN after 20 attempts.");
}

async function attemptVisitorInsert(
  tx: Prisma.TransactionClient,
  input: ValidRegistrationInput,
  now: Date,
): Promise<InsertAttemptOutcome> {
  const { pin, pinLookup, encryptedPin } = await generateUniquePin(tx);

  try {
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

    const result = await finalizeVisitorRegistration(tx, { id: visitor.id, pin }, input);

    return { kind: "completed", result };
  } catch (cause) {
    return handleInsertError(cause);
  }
}

export async function generateUniquePin(
  tx: Prisma.TransactionClient,
  randomSource: RandomPinSource = defaultRandomPinSource,
): Promise<GeneratedPin> {
  for (let attempt = 1; attempt <= MAX_PIN_ATTEMPTS; attempt++) {
    const rawPin = sampleRandomPin(randomSource);
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

  throw new Error("Unable to generate a unique PIN after 20 attempts.");
}

function sampleRandomPin(source: RandomPinSource): string {
  return String(source()).padStart(5, "0");
}

function defaultRandomPinSource(): number {
  return randomInt(0, 100_000);
}

async function finalizeVisitorRegistration(
  tx: Prisma.TransactionClient,
  visitor: { id: string; pin: string },
  input: ValidRegistrationInput,
): Promise<RegistrationResult> {
  const deviceToken = await createVisitorDevice(tx, visitor.id);
  const passportUrl = `${siteConfig.url}${PASSPORT_PATH}`;

  const emailId = await enqueueEmail(tx, {
    to: input.email,
    subject: VISITORS_COPY.email.subject(input.gamertag),
    text: VISITORS_COPY.email.body(visitor.pin, input.gamertag, passportUrl),
  });

  await recordVisitorAudit(tx, visitor.id, input.gamertag);

  return {
    status: "created",
    visitorId: visitor.id,
    deviceToken,
    emailId,
  };
}

function handleInsertError(cause: unknown): InsertAttemptOutcome {
  if (!isPrismaUniqueViolation(cause)) {
    throw cause;
  }

  const resolution = mapUniqueViolation(cause.meta?.target);

  if (resolution?.status === "retryPin") {
    return { kind: "retry" };
  }

  if (resolution) {
    return { kind: "completed", result: resolution };
  }

  throw cause;
}

export function mapUniqueViolation(target: UniqueViolationTarget): UniqueViolationResolution {
  const targets = normalizeTargets(target);

  if (targets.some((item) => item.includes("gamertag"))) {
    return { status: "gamertagTaken" };
  }

  if (targets.some((item) => item.includes("email"))) {
    return { status: "blocked" };
  }

  if (targets.some((item) => item.includes("pin_hmac") || item.includes("pinlookup"))) {
    return { status: "retryPin" };
  }

  return null;
}

function normalizeTargets(target: UniqueViolationTarget): string[] {
  if (target === null || target === undefined) {
    return [];
  }

  if (Array.isArray(target)) {
    return target.map((item) => item.toLowerCase());
  }

  return [target.toLowerCase()];
}

function isPrismaUniqueViolation(cause: unknown): cause is PrismaUniqueError {
  return cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002";
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
