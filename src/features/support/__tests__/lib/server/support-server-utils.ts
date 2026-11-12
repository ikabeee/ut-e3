import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

// The event hour the tests that read the real clock are set to, so the rate-limit windows hold still and the tests
// keep passing after the event.
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

// A fake passport: the table is shared, but this feature does not import the registration of visitors.
export async function createVisitor(gamertag: string, fullName: string, pin = "12345") {
  return getPrisma().visitor.create({
    data: {
      fullName,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
    },
  });
}

export async function createAccount(email: string, role: string, standId?: string) {
  return getPrisma().account.create({
    data: { email, name: `Cuenta ${email}`, role, status: "active", password: "hash", standId },
  });
}

// The stand accounts need one, and the table is shared: this feature does not import the stands.
export async function createStand() {
  return getPrisma().stand.create({ data: { zone: "A", number: 1, studio: 1, groupCode: "101" } });
}

// Accounts stay: the audit log is insert-only and keeps a reference to the agent of every entry.
export async function clearTables(): Promise<void> {
  await getPrisma().tournamentEntry.deleteMany();
  await getPrisma().session.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
}

interface EventHours {
  /** The on-site KOF sign-up; the default one holds EVENT_NOW. */
  onsiteStartsAt?: Date;
  onsiteEndsAt?: Date;
  registrationOpensAt?: Date;
}

// The table is shared, but this feature does not import event-settings: the row is written here with the seed values.
export async function resetEventSettings(hours: EventHours = {}): Promise<void> {
  await getPrisma().eventSettings.deleteMany();
  await getPrisma().eventSettings.create({
    data: {
      id: 1,
      eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
      registrationOpensAt: hours.registrationOpensAt ?? new Date("2026-11-13T05:00:00.000Z"),
      kofRegistrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      kofCheckInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      kofCheckInEndsAt: new Date("2026-11-20T19:30:00.000Z"),
      kofOnsiteSignupStartsAt: hours.onsiteStartsAt ?? new Date("2026-11-20T17:00:00.000Z"),
      kofOnsiteSignupEndsAt: hours.onsiteEndsAt ?? new Date("2026-11-20T19:00:00.000Z"),
      kofBracketGeneratesAt: new Date("2026-11-20T19:55:00.000Z"),
      marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
      itchOpensAt: new Date("2026-11-20T21:30:00.000Z"),
      checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
      raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
      publicBracketEnabled: true,
    },
  });
}
