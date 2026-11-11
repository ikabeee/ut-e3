import "server-only";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { RejectedVisitNotice } from "@features/stands/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

/** The refusals of the visitor's queued visits, oldest first. It reads the session's visitor, so it is never cached. */
export async function getRejectedVisitNotices(visitorId: string): Promise<RejectedVisitNotice[]> {
  const rows = await getPrisma().rejectedVisit.findMany({
    where: { visitorId },
    orderBy: { scannedAt: "asc" },
    select: { id: true, stand: { select: { zone: true, number: true } } },
  });

  return rows.map((row) => ({ id: row.id, standCode: formatStandCode(row.stand) }));
}
