import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

// kofBracketGeneratesAt of the seed: 12:55 in Cancun.
export const GENERATES_AT = new Date("2026-11-20T17:55:00.000Z");

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
      kofBracketGeneratesAt: GENERATES_AT,
      marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
      itchOpensAt: new Date("2026-11-20T21:30:00.000Z"),
      checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
      raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
      publicBracketEnabled: true,
    },
  });
}

// Fake passports for the entries tests: the table is shared, but this feature does not import visitors.
export async function createVisitors(count: number) {
  const visitors = [];

  for (let index = 1; index <= count; index += 1) {
    visitors.push(await createVisitor(`Jugador${index}`, String(index).padStart(5, "0")));
  }

  return visitors;
}

export async function createVisitor(gamertag: string, pin = "12345") {
  return getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
    },
  });
}
