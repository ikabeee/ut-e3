import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export interface VisitorSeed {
  gamertag: string;
  pin?: string;
  fullName?: string;
  email?: string;
  createdAt?: Date;
}

let pinCounter = 10_000;

/** A passport with an encrypted PIN; without a `pin` it gets the next free one. */
export async function createVisitor(seed: VisitorSeed) {
  pinCounter += 1;

  const pin = seed.pin ?? String(pinCounter);

  return getPrisma().visitor.create({
    data: {
      fullName: seed.fullName ?? `Nombre ${seed.gamertag}`,
      gamertag: seed.gamertag,
      email: seed.email ?? `${seed.gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
      createdAt: seed.createdAt,
    },
  });
}

export async function clearVisitorTables() {
  const prisma = getPrisma();

  await prisma.raffleTicket.deleteMany();
  await prisma.tournamentEntry.deleteMany();
  await prisma.recoveryToken.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.emailBlocklist.deleteMany();
}

export function editForm(visitorId: string, fields: { fullName: string; gamertag: string; email: string }): FormData {
  const form = new FormData();

  form.set("visitorId", visitorId);
  form.set("fullName", fields.fullName);
  form.set("gamertag", fields.gamertag);
  form.set("email", fields.email);

  return form;
}

export function visitorForm(visitorId: string): FormData {
  const form = new FormData();

  form.set("visitorId", visitorId);

  return form;
}

/** The audit log never loses a row, so a test counts what its own steps added since this baseline. */
export async function countAuditEntries(): Promise<number> {
  return getPrisma().auditLog.count();
}

export async function auditEntriesSince(baseline: number) {
  const entries = await getPrisma().auditLog.findMany({ orderBy: { createdAt: "asc" } });

  return entries.slice(baseline);
}
