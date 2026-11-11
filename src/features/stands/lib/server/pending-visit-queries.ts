import "server-only";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { PendingVisitView, VisitStatus } from "@features/stands/lib/pending-visit";
import { getPrisma } from "@shared/lib/server/prisma";

/** The visit the staff is waiting on for this visitor, if there is one that did not expire. */
export async function getVisitorPendingVisit(visitorId: string, now: Date): Promise<PendingVisitView | null> {
  const pending = await getPrisma().pendingVisit.findFirst({
    where: { visitorId, answeredAt: null, expiresAt: { gt: now } },
    select: { id: true, stand: { select: { zone: true, number: true, game: { select: { name: true } } } } },
  });

  if (!pending?.stand.game) return null;

  return { id: pending.id, standCode: formatStandCode(pending.stand), gameName: pending.stand.game.name };
}

/** What the kiosk of the stand sees of its pending visit: rated, still waiting, or gone (expired, cancelled, replaced). */
export async function getPendingVisitStatus(pendingVisitId: string, standId: string, now: Date): Promise<VisitStatus> {
  const pending = await getPrisma().pendingVisit.findFirst({
    where: { id: pendingVisitId, standId },
    select: { answeredAt: true, expiresAt: true },
  });

  if (!pending) return "expired";

  if (pending.answeredAt) return "answered";

  return pending.expiresAt > now ? "waiting" : "expired";
}
