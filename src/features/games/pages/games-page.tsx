import type { Metadata } from "next";
import { Suspense } from "react";
import { GamesCatalog } from "@features/games/components/games-catalog";
import { GamesCatalogSkeleton } from "@features/games/components/games-catalog-skeleton";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { getGamesHydrationState } from "@features/games/lib/server/games-prefetch";
import { QueryHydrationBoundary } from "@shared/components/query-hydration-boundary";

export const gamesPageMetadata: Metadata = {
  title: "Juegos",
  description:
    "Explora los videojuegos del showcase de la UT Cancún por género, equipo o stand y encuentra dónde jugarlos.",
  alternates: { canonical: GAMES_PATH },
};

export function GamesPage() {
  return (
    <main className="pt-[clamp(32px,5vw,64px)]">
      <div className="page-wrap">
        <Suspense fallback={<GamesCatalogSkeleton />}>
          <QueryHydrationBoundary state={getGamesHydrationState()}>
            <GamesCatalog />
          </QueryHydrationBoundary>
        </Suspense>
      </div>
    </main>
  );
}
