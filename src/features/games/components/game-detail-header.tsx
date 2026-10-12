import Link from "next/link";
import { GAMES_PATH, getGamePath } from "@features/games/lib/game-links";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

interface GameDetailHeaderProps {
  game: Game;
}

/** Regreso al catálogo, nombre, equipo y pestañas del detalle. */
export function GameDetailHeader({ game }: Readonly<GameDetailHeaderProps>) {
  return (
    <>
      <Link
        href={GAMES_PATH}
        className="touch-target relative mb-[18px] inline-block type-tiny text-muted no-underline hover:text-accent"
      >
        {GAMES_COPY.detail.backToCatalog}
      </Link>
      <header className="flex flex-col gap-[10px]">
        <h1 className="font-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] font-bold tracking-[-.035em] uppercase">
          {game.name}
        </h1>
        <p className="m-0 type-tiny text-muted">{GAMES_COPY.detail.teamAndStand(game)}</p>
      </header>
      <nav aria-label={GAMES_COPY.detail.sectionsLabel} className="my-6 flex gap-6 border-b border-border type-tiny">
        <Link
          href={getGamePath(game.slug)}
          aria-current="page"
          className="touch-target relative -mb-px border-b-2 border-accent py-3 text-accent no-underline"
        >
          {GAMES_COPY.detail.overviewTab}
        </Link>
      </nav>
    </>
  );
}
