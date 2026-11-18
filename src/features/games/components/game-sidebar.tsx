import type { ReactNode } from "react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

const COVER_SIZES = "320px";

interface GameSidebarProps {
  game: Game;
  itchLink: ReactNode;
  eventDateLabel: string;
}

// The cover and the facts repeat the page on a phone, so they only show beside the main column.
export function GameSidebar({ game, itchLink, eventDateLabel }: Readonly<GameSidebarProps>) {
  return (
    <aside
      aria-label={GAMES_COPY.sidebar.label(game.name)}
      className="-order-1 flex flex-col gap-3 detail:sticky detail:top-[calc(env(safe-area-inset-top,0px)+var(--spacing-nav)+20px)] detail:order-0"
    >
      <div className="relative hidden aspect-3/4 overflow-hidden border border-border bg-surface detail:block">
        <GameCoverImage game={game} sizes={COVER_SIZES} />
      </div>
      {itchLink}
      <GameFacts game={game} eventDateLabel={eventDateLabel} />
    </aside>
  );
}

function GameFacts({ game, eventDateLabel }: Readonly<Pick<GameSidebarProps, "game" | "eventDateLabel">>) {
  const { labels } = GAMES_COPY;

  const rows = [
    { label: labels.genre, value: game.genre.name },
    { label: labels.stand, value: formatStandCode(game.stand) },
    { label: labels.event, value: eventDateLabel },
  ];

  return (
    <dl className="mt-1.5 hidden flex-col detail:flex">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-3 border-b border-separator py-2.75">
          <dt className="font-mono text-xs text-muted uppercase">{row.label}</dt>
          <dd className="text-right font-mono text-xs uppercase">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
