import Link from "next/link";
import type { ReactNode } from "react";
import { GameDetailHeader } from "@features/games/components/game-detail-header";
import { GameGallery } from "@features/games/components/game-gallery";
import { GamePlayLocation } from "@features/games/components/game-play-location";
import { GameSidebar } from "@features/games/components/game-sidebar";
import { RelatedGames } from "@features/games/components/related-games";
import { getGalleryImages } from "@features/games/lib/game-cover";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { getGenrePath } from "@features/games/lib/games-links";
import type { Game, GameDetailLinks, GameEventLabels, Genre } from "@features/games/lib/types";

interface GameDetailProps {
  game: Game;
  itchLink: ReactNode;
  event: GameEventLabels;
  links: GameDetailLinks;
  relatedGames: Game[];
}

// Main column and a sticky sidebar from the `detail` breakpoint up; below that one column with the sidebar actions first.
export function GameDetail({ game, itchLink, event, links, relatedGames }: Readonly<GameDetailProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col gap-6 py-[clamp(24px,4vw,48px)]">
      <GameDetailHeader game={game} catalogHref={links.catalog} />
      <div className="grid items-start gap-[clamp(24px,4vw,56px)] detail:grid-cols-[minmax(0,1fr)_320px]">
        <GameOverview game={game} event={event} />
        <GameSidebar game={game} itchLink={itchLink} eventDateLabel={event.dateLabel} links={links} />
      </div>
      <RelatedGames games={relatedGames} catalogHref={links.catalog} />
    </main>
  );
}

function GameOverview({ game, event }: Readonly<Pick<GameDetailProps, "game" | "event">>) {
  return (
    <div className="flex min-w-0 flex-col gap-7">
      <GameGallery images={getGalleryImages(game)} />
      <p className="max-w-[62ch] text-[clamp(17px,1.5vw,20px)] leading-[1.4] text-copy-strong">{game.synopsis}</p>
      <GameTags genre={game.genre} />
      <GamePlayLocation stand={game.stand} event={event} />
    </div>
  );
}

function GameTags({ genre }: Readonly<{ genre: Genre }>) {
  return (
    <dl aria-label={GAMES_COPY.detail.tags} className="flex flex-col gap-1.5 border-l-2 border-accent pl-4">
      <dt className="type-tiny text-muted">{GAMES_COPY.labels.genre}</dt>
      <dd className="m-0 self-start">
        <Link
          href={getGenrePath(genre.slug)}
          className="touch-target relative border-b border-muted pb-px font-mono text-xs text-foreground uppercase no-underline hover:border-accent hover:text-accent"
        >
          {genre.name}
        </Link>
      </dd>
    </dl>
  );
}
