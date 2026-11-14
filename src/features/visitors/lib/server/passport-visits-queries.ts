import "server-only";

import { formatStandCode } from "@features/games/lib/stand-code";
import { VALID_CHECK_IN_WHERE } from "@features/visitors/lib/server/milestone-tickets";
import type { PassportTicket, PassportVisits } from "@features/visitors/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

export async function getPassportVisits(visitorId: string): Promise<PassportVisits> {
  const [stands, checkIns, tickets] = await Promise.all([
    getPrisma().stand.findMany({
      select: { id: true, zone: true, number: true, game: { select: { name: true } } },
      orderBy: [{ zone: "asc" }, { number: "asc" }],
    }),
    getPrisma().checkIn.findMany({
      // An annulled visit (RF-46) is not shown: the stand reads as not visited and the count goes down.
      where: { visitorId, ...VALID_CHECK_IN_WHERE },
      select: { standId: true },
    }),
    getPrisma().raffleTicket.findMany({
      where: { visitorId },
      orderBy: { number: "asc" },
      select: { number: true, milestone: true, status: true },
    }),
  ]);

  const visitedStandIds = new Set(checkIns.map((checkIn) => checkIn.standId));

  return {
    visitCount: checkIns.length,
    stands: stands.map((stand) => ({
      code: formatStandCode(stand),
      visited: visitedStandIds.has(stand.id),
      gameName: stand.game?.name ?? null,
    })),
    tickets: tickets.map(toPassportTicket),
  };
}

// A voided ticket stays on the passport with its number, so the visitor sees why it is not in the raffle (RF-46).
function toPassportTicket({ number, milestone, status }: { number: number; milestone: number; status: string }) {
  const ticket: PassportTicket = { number, milestone };

  return status === "voided" ? { ...ticket, voided: true } : ticket;
}
