import { MAX_ATTEMPTS } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";

export const NOW = new Date("2026-11-20T18:00:00.000Z");

let counter = 0;

interface EmailData {
  to?: string;
  subject?: string;
  text?: string;
  attempts?: number;
  sentAt?: Date;
  createdAt?: Date;
  kind?: string;
  referenceId?: string;
}

/** An abandoned email: all attempts used and the body erased, as `deliverEmail` leaves it. */
export function createAbandoned(data: EmailData = {}) {
  return createEmail({ attempts: MAX_ATTEMPTS, text: "", ...data });
}

export function createFailed(data: EmailData = {}) {
  return createEmail({ attempts: MAX_ATTEMPTS, ...data });
}

/** A row of the outbox; without data it is a pending email with a body. */
export async function createEmail(data: EmailData = {}) {
  counter += 1;

  return getPrisma().emailOutbox.create({
    data: { to: `persona${counter}@example.com`, subject: `Asunto ${counter}`, text: "Hola", ...data },
  });
}

/** The audit log is insert-only, so each test has its own actor and reads only the entries that actor made. */
export async function auditActions(actorId: string): Promise<string[]> {
  const entries = await getPrisma().auditLog.findMany({
    where: { actorId },
    orderBy: { createdAt: "asc" },
    select: { action: true },
  });

  return entries.map((entry) => entry.action);
}

export async function findEmail(id: string) {
  return getPrisma().emailOutbox.findUnique({ where: { id } });
}
