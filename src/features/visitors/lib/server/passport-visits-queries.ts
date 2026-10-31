import "server-only";

import { formatStandCode } from "@features/games/lib/stand-code";
import type { PassportVisits } from "@features/visitors/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

export async function getPassportVisits(visitorId: string): Promise<PassportVisits> {
  const [stands, checkIns, tickets] = await Promise.all([
    getPrisma().stand.findMany({
      select: { id: true, zone: true, number: true },
      orderBy: [{ zone: "asc" }, { number: "asc" }],
    }),
    getPrisma().checkIn.findMany({
      where: { visitorId },
      select: { standId: true },
    }),
    getPrisma().raffleTicket.findMany({
      where: { visitorId },
      orderBy: { number: "asc" },
      select: { number: true, milestone: true },
    }),
  ]);

  const visitedStandIds = new Set(checkIns.map((checkIn) => checkIn.standId));

  return {
    visitCount: checkIns.length,
    stands: stands.map((stand) => ({
      code: formatStandCode(stand),
      visited: visitedStandIds.has(stand.id),
    })),
    tickets,
  };
}
