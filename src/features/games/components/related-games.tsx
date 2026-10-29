import Link from "next/link";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";
import { DETAIL_COLUMNS_MEDIA } from "@features/games/lib/game-detail-layout";

const HEADING_ID = "related-games-heading";

const COVER_SIZES = `${DETAIL_COLUMNS_MEDIA} 20vw, (min-width: 560px) 33vw, 50vw`;

interface RelatedGamesProps {
  games: Game[];
  catalogHref: string;
}

export function RelatedGames({ games, catalogHref }: Readonly<RelatedGamesProps>) {
  if (games.length === 0) return null;

  return (
    <section aria-labelledby={HEADING_ID} className="mt-[clamp(56px,8vw,96px)] flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 id={HEADING_ID} className="type-section">
          {GAMES_COPY.related.heading}
        </h2>
        <Link href={catalogHref} className="touch-target relative type-tiny text-accent no-underline">
          {GAMES_COPY.related.seeAll}
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-4 min-[560px]:grid-cols-3 detail:grid-cols-5">
        {games.map((game) => (
          <li key={game.slug}>
            <RelatedGameCard game={game} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// The name is in the link, so the cover is decorative.
function RelatedGameCard({ game }: Readonly<{ game: Game }>) {
  return (
    <Link href={getGamePath(game.slug)} className="group flex flex-col gap-2 no-underline">
      <span className="relative block aspect-3/4 overflow-hidden border border-border bg-surface group-hover:border-accent">
        <GameCoverImage game={game} sizes={COVER_SIZES} isDecorative />
      </span>
      <span className="type-wide text-sm wrap-break-word">{game.name}</span>
      <span className="type-tiny text-muted">{game.genre.name}</span>
    </Link>
  );
}
