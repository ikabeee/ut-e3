import "server-only";
import { toPublicBracket, type PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import { getPrisma } from "@shared/lib/server/prisma";

/** What the public endpoint answers. When the view is closed the bracket is not even read (RF-67, RF-74). */
export async function getPublicSnapshot(now: Date): Promise<PublicSnapshot> {
  const serverNow = now.getTime();

  if (!(await getPublicBracketEnabled())) return { state: "closed", serverNow };

  const tournament = await getTournament();

  return tournament
    ? { state: "open", bracket: toPublicBracket(tournament), serverNow }
    : { state: "pending", serverNow };
}

/** Missing settings count as closed: with nothing configured the safe side is to show nothing. */
export async function getPublicBracketEnabled(): Promise<boolean> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { publicBracketEnabled: true },
  });

  return settings?.publicBracketEnabled ?? false;
}
