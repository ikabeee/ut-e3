import Link from "next/link";
import { getGameFeatures } from "@features/games/lib/game-details";
import { getGenreCatalogPath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";

interface GameTagsProps {
  game: Game;
}

const TAG_CLASS = "font-mono text-xs uppercase text-foreground no-underline border-b border-muted pb-px";

/** Género (enlace al catálogo filtrado) y características del juego (`.jg-tags`). */
export function GameTags({ game }: Readonly<GameTagsProps>) {
  return (
    <div className="grid grid-cols-2 gap-4 border-l-2 border-accent pl-4 max-[560px]:grid-cols-1">
      <div>
        <span className="type-tiny text-muted">Género</span>
        <div className="mt-[6px] flex flex-wrap gap-[6px]">
          <Link href={getGenreCatalogPath(game.genre)} className={`${TAG_CLASS} hover:border-accent hover:text-accent`}>
            {game.genre}
          </Link>
        </div>
      </div>
      <div>
        <span className="type-tiny text-muted">Características</span>
        <div className="mt-[6px] flex flex-wrap gap-[6px]">
          {getGameFeatures(game).map((feature) => (
            <span key={feature} className={TAG_CLASS}>
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
