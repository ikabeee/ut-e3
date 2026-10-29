import type { ReactNode } from "react";
import { GameGallery } from "@features/games/components/game-gallery";
import { getGalleryImages } from "@features/games/lib/game-cover";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

interface GameDetailProps {
  game: Game;
  itchLink: ReactNode;
}

export function GameDetail({ game, itchLink }: Readonly<GameDetailProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col gap-8 py-16">
      <header className="flex flex-col gap-4">
        <h1 className="type-section">{game.name}</h1>
        <GameFacts game={game} />
      </header>
      <p className="max-w-2xl text-lg text-copy">{game.synopsis}</p>
      {itchLink}
      <GameGallery images={getGalleryImages(game)} />
    </main>
  );
}

function GameFacts({ game }: Readonly<{ game: Game }>) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-2 type-mono">
      <div className="flex gap-2">
        <dt className="text-muted">{GAMES_COPY.detail.genre}</dt>
        <dd>{game.genre.name}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted">{GAMES_COPY.detail.stand}</dt>
        <dd>{formatStandCode(game.stand)}</dd>
      </div>
    </dl>
  );
}
