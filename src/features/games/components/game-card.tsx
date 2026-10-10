import Link from "next/link";
import { GameMedia } from "@features/games/components/game-media";
import { getGamePath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";

interface GameCardProps {
  game: Game;
  /** Atributo `sizes` de la portada según la cuadrícula donde se muestre. */
  coverSizes: string;
  /** Texto bajo el nombre; por defecto "Equipo · Género". */
  caption?: string;
  /** Muestra la etiqueta del stand sobre la portada. */
  showStand?: boolean;
}

/** Portada vertical con nombre que lleva al detalle del juego (`.gc` / `.mc` del diseño). */
export function GameCard({ game, coverSizes, caption, showStand = true }: Readonly<GameCardProps>) {
  return (
    <Link href={getGamePath(game.slug)} className="group flex min-w-0 flex-col gap-[10px] text-foreground no-underline">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface outline outline-1 outline-surface transition-[outline-color] duration-200 group-hover:outline-accent">
        <GameMedia
          game={game}
          sizes={coverSizes}
          className="transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
        />
        {showStand ? (
          <span className="absolute top-0 left-0 bg-background px-2 py-1 font-mono text-[11px] font-bold text-accent">
            {game.stand}
          </span>
        ) : null}
      </div>
      <h3 className="font-wide text-sm leading-[1.05] font-bold tracking-[-.02em] uppercase group-hover:text-accent">
        {game.name}
      </h3>
      <span className="type-tiny text-muted">{caption ?? `${game.team} · ${game.genre}`}</span>
    </Link>
  );
}
