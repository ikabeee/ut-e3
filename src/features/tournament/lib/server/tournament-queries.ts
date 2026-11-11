import "server-only";
import { isTournament } from "@features/tournament/lib/tournament-guards";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { Tournament } from "@features/tournament/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

/** There is one tournament per event, so its row is a singleton like `event_settings`. */
export const TOURNAMENT_ROW_ID = 1;

/** The current bracket, or `null` until it is generated. Not cached: the desks need the latest result. */
export async function getTournament(): Promise<Tournament | null> {
  const row = await getPrisma().kofTournament.findUnique({ where: { id: TOURNAMENT_ROW_ID } });

  if (!row) return null;

  if (!isTournament(row.state)) throw new Error(TOURNAMENT_COPY.errors.damagedState);

  return row.state;
}

export async function getBracketGeneratesAt(): Promise<Date | null> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { kofBracketGeneratesAt: true },
  });

  return settings?.kofBracketGeneratesAt ?? null;
}
