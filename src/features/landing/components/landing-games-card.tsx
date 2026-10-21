import Link from "next/link";
import { GameMedia } from "@features/games/components/game-media";
import { getGamePath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

/** Tarjeta de juego de la banda oscura: portada, nombre, género, descripción y enlace al detalle. */
export function LandingGamesCard({ game }: Readonly<{ game: Game }>) {
  return (
    <article className="relative flex h-full flex-col gap-4 rounded-[20px] bg-background p-4 text-foreground">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <GameMedia game={game} sizes="(min-width: 1024px) 28vw, 80vw" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="rounded-full border border-foreground bg-accent px-3 py-1 type-tiny font-wide font-bold text-accent-foreground uppercase">
          {game.name}
        </h3>
        <span className="bg-foreground px-3 py-1 type-tiny text-background">{game.genre}</span>
      </div>
      <p className="line-clamp-3 flex-1 text-sm text-muted">{game.description}</p>
      <Link
        href={getGamePath(game.slug)}
        aria-label={LANDING_COPY.games.viewGame(game.name)}
        className="touch-target absolute relative top-4 right-4 flex size-11 items-center justify-center rounded-full bg-foreground text-background"
      >
        <ArrowGlyph direction="ne" />
      </Link>
    </article>
  );
}
