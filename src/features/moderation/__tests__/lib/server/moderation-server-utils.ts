import { grantMilestoneTickets } from "@features/visitors/lib/server/milestone-tickets";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

// raffleStartsAt of the seed: 18:00 in Cancun.
export const RAFFLE_STARTS_AT = new Date("2026-11-20T23:00:00.000Z");

export const BEFORE_RAFFLE = new Date("2026-11-20T20:00:00.000Z");

export const AFTER_RAFFLE = new Date("2026-11-20T23:30:00.000Z");

// The row of event_settings with the times of the seed and the initial thresholds (12, 10 and 1).
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

export async function createStands(count: number) {
  const stands = [];

  for (let number = 1; number <= count; number += 1) {
    stands.push(await getPrisma().stand.create({ data: { zone: "B", number, studio: 2, groupCode: "202" } }));
  }

  return stands;
}

export async function createSysadmin() {
  return getPrisma().account.create({
    data: { email: "sysadmin@example.test", name: "Coordinación", role: "sysadmin", status: "active", password: "x" },
  });
}

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

/** Records the visits with their votes and grants the tickets, as the kiosk does in one transaction. */
export async function visitStands(request: { visitorId: string; standIds: string[]; rating?: number; at?: Date }) {
  const { visitorId, standIds, rating = 4, at = new Date("2026-11-20T19:00:00.000Z") } = request;

  await getPrisma().$transaction(async (transaction) => {
    for (const standId of standIds) {
      const checkIn = await transaction.checkIn.create({ data: { visitorId, standId, checkedInAt: at } });

      await transaction.vote.create({
        data: {
          checkInId: checkIn.id,
          visitorId,
          standId,
          gameRating: rating,
          standRating: rating,
          artRating: rating,
          createdAt: at,
        },
      });
    }

    await grantMilestoneTickets(transaction, visitorId);
  });
}

export async function ticketsOf(visitorId: string) {
  return getPrisma().raffleTicket.findMany({
    where: { visitorId },
    orderBy: { milestone: "asc" },
    select: { number: true, milestone: true, status: true },
  });
}
