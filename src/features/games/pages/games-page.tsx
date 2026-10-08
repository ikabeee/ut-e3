import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingMessage, PageSection } from "@/shared/components";
import { GamesCatalog } from "../components/games-catalog";
import { listPublishedGames } from "../lib/game-queries";

export const gamesPageMetadata: Metadata = {
  title: "Videojuegos",
};

async function PublishedGamesCatalog() {
  const games = await listPublishedGames();
  return <GamesCatalog games={games} />;
}

export function GamesPage() {
  return (
    <PageSection title="Videojuegos">
      <Suspense fallback={<LoadingMessage message="Cargando videojuegos..." />}>
        <PublishedGamesCatalog />
      </Suspense>
    </PageSection>
  );
}
