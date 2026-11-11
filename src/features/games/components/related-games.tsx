import Link from "next/link";
import { GameCard } from "@features/games/components/game-card";
import { GAME_SECTION_HEADING_CLASS } from "@features/games/components/game-detail-section";
import type { Game } from "@features/games/lib/types";
import { routes } from "@shared/lib/site-config";

interface RelatedGamesProps {
  games: readonly Game[];
}

const COVER_SIZES = "(max-width: 560px) 50vw, (max-width: 980px) 33vw, 20vw";

/** "Más juegos" al final del detalle (`.more`). */
export function RelatedGames({ games }: Readonly<RelatedGamesProps>) {
  return (
    <section className="mt-[clamp(56px,8vw,96px)]" aria-labelledby="related-games-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="related-games-heading" className={GAME_SECTION_HEADING_CLASS}>
          Más juegos
        </h2>
        <Link href={routes.games} className="type-tiny text-accent no-underline">
          Ver todos ↗
        </Link>
      </div>
      <div className="grid grid-cols-5 gap-4 max-[980px]:grid-cols-3 max-[560px]:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} coverSizes={COVER_SIZES} variant="compact" />
        ))}
      </div>
    </section>
  );
}
