import Link from "next/link";
import { getGamePath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";
import { routes } from "@shared/lib/site-config";

interface GameDetailHeaderProps {
  game: Game;
}

/** Regreso al catálogo, nombre, equipo y pestañas del detalle. */
export function GameDetailHeader({ game }: Readonly<GameDetailHeaderProps>) {
  return (
    <>
      <Link href={routes.games} className="type-tiny mb-[18px] inline-block text-muted no-underline hover:text-accent">
        ← Todos los juegos
      </Link>
      <header className="flex flex-col gap-[10px]">
        <h1 className="font-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] font-bold tracking-[-.035em] uppercase">
          {game.name}
        </h1>
        <p className="type-tiny m-0 text-muted">
          {game.team} · Stand {game.stand}
        </p>
      </header>
      <nav aria-label="Secciones del juego" className="type-tiny my-6 flex gap-6 border-b border-border">
        <Link
          href={getGamePath(game.slug)}
          aria-current="page"
          className="-mb-px border-b-2 border-accent py-3 text-accent no-underline"
        >
          Información general
        </Link>
      </nav>
    </>
  );
}
