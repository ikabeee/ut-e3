import Link from "next/link";
import { cn } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import { getGamePath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";

interface GameCardProps {
  game: Game;
  /** Atributo `sizes` de la portada según la cuadrícula donde se muestre. */
  coverSizes: string;
  /**
   * `catalog`: tarjeta del catálogo con stand, equipo y género (`.gc`).
   * `compact`: tarjeta de "Más juegos", sólo con el género (`.mc`).
   */
  variant?: "catalog" | "compact";
}

/** Portada vertical con nombre que lleva al detalle del juego. */
export function GameCard({ game, coverSizes, variant = "catalog" }: Readonly<GameCardProps>) {
  const isCatalog = variant === "catalog";

  return (
    <Link
      href={getGamePath(game.slug)}
      className={cn("group flex min-w-0 flex-col text-foreground no-underline", isCatalog ? "gap-[10px]" : "gap-2")}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface outline outline-1 outline-surface transition-[outline-color] duration-200 group-hover:outline-accent">
        <GameMedia
          game={game}
          sizes={coverSizes}
          className={cn(
            "transition-transform duration-500 group-hover:scale-[1.04]",
            isCatalog && "ease-[cubic-bezier(.2,.7,.2,1)]",
          )}
        />
        {isCatalog ? (
          <span className="absolute top-0 left-0 bg-background px-2 py-1 font-mono text-[11px] font-bold text-accent">
            {game.stand}
          </span>
        ) : null}
      </div>
      <h3
        className={cn(
          "font-wide leading-[1.05] font-bold uppercase group-hover:text-accent",
          isCatalog ? "text-sm tracking-[-.02em]" : "text-[13px]",
        )}
      >
        {game.name}
      </h3>
      <span className="type-tiny text-muted">{isCatalog ? `${game.team} · ${game.genre}` : game.genre}</span>
    </Link>
  );
}
