import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

// raffleStartsAt of the seed: 18:00 in Cancun.
export const RAFFLE_STARTS_AT = new Date("2026-11-20T23:00:00.000Z");

export const DURING_RAFFLE = new Date("2026-11-20T23:05:00.000Z");

let visitorCount = 0;

let accountCount = 0;

// The table is shared, but this feature does not import event-settings: the row is written here with the seed values.
export async function createEventSettings() {
  await getPrisma().eventSettings.create({
    data: {
      id: 1,
      eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
      registrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      kofRegistrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      kofCheckInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      kofCheckInEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      kofOnsiteSignupStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      kofOnsiteSignupEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      kofBracketGeneratesAt: new Date("2026-11-20T17:55:00.000Z"),
      marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
      itchOpensAt: new Date("2026-11-20T21:30:00.000Z"),
      checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
      raffleStartsAt: RAFFLE_STARTS_AT,
      publicBracketEnabled: true,
    },
  });
}

export async function createRaffleAdmin(name = "Animador") {
  accountCount += 1;

  return getPrisma().account.create({
    data: { email: `rifa-${accountCount}@ut.mx`, name, role: "raffle_admin", status: "active", password: "hash" },
  });
}

/** A fake passport with tickets for the given milestones: the table is shared, this feature does not import visitors. */
export async function createVisitorWithTickets(gamertag: string, milestones: readonly number[] = [9]) {
  visitorCount += 1;

  const pin = String(30000 + visitorCount);

  const visitor = await getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
    },
  });

  for (const milestone of milestones) {
    await getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone } });
  }

  return visitor;
}

// Draws cannot be deleted (trigger), so every test starts from a new database file instead of clearing the tables.
export function nextRequestId(): string {
  return crypto.randomUUID();
}
