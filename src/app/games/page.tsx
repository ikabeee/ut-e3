import type { Metadata } from "next";
import { Suspense } from "react";
import { GameGrid } from "@/modules/games";
import { listPublishedGames } from "@/modules/games/server";
import { Container } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Videojuegos",
};

async function PublishedGames() {
  const games = await listPublishedGames();
  return <GameGrid games={games} />;
}

export default function GamesPage() {
  return (
    <Container>
      <section className="flex flex-col gap-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Videojuegos</h1>
        <Suspense fallback={<p className="text-zinc-500">Cargando videojuegos…</p>}>
          <PublishedGames />
        </Suspense>
      </section>
    </Container>
  );
}
