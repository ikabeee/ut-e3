import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

// checkInCutoffAt of the seed: 16:50 in Cancun.
export const CUTOFF_AT = new Date("2026-11-20T21:50:00.000Z");

// The table is shared, but this feature does not import event-settings: the row is written here with the seed values.
// The event hour the tests that read the real clock are set to, so they keep passing after the event.
const EVENT_NOW = new Date("2026-11-20T18:00:00.000Z");

// Only `Date` is faked: the database and the timers of the test keep running normally.
export function setClockToTheEvent(): void {
  jest.useFakeTimers({
    now: EVENT_NOW,
    doNotFake: [
      "hrtime",
      "nextTick",
      "performance",
      "queueMicrotask",
      "setImmediate",
      "clearImmediate",
      "setInterval",
      "clearInterval",
      "setTimeout",
      "clearTimeout",
    ],
  });
}

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
      checkInCutoffAt: CUTOFF_AT,
      raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
      publicBracketEnabled: true,
    },
  });
}

// A stand of the zone A; with `gameName` it also has the game that lets it receive visits (RF-34).
export async function createStand(number: number, gameName: string | null = `Juego ${number}`) {
  const stand = await getPrisma().stand.create({
    data: { zone: "A", number, studio: 1, groupCode: "101" },
  });

  if (gameName) {
    const genre = await getPrisma().genre.upsert({
      where: { slug: "accion" },
      update: {},
      create: { name: "Acción", slug: "accion" },
    });

    await getPrisma().game.create({
      data: {
        standId: stand.id,
        name: gameName,
        slug: `juego-${number}`,
        synopsis: "Un juego de prueba.",
        genreId: genre.id,
      },
    });
  }

  return stand;
}

// A fake passport: the table is shared, but this feature does not import visitors.
export async function createVisitor(gamertag: string, pin: string) {
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

export async function createStandAccount(email: string, role: "stand_admin" | "stand_staff", standId: string) {
  return getPrisma().account.create({
    data: { email, name: `Cuenta ${email}`, role, status: "active", password: "hash", standId },
  });
}
