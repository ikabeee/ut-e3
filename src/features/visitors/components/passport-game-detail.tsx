import type { Ref } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ActionLink } from "@shared/components/action-link";

const COPY = VISITORS_COPY.passport.explorer;

const STANDS_COPY = VISITORS_COPY.passport.stands;

const HEADING_ID = "passport-game-detail-heading";

interface PassportGameDetailProps {
  ref?: Ref<HTMLElement>;
  /** The marker selected on the map; `null` until the visitor taps one. */
  item: MapItem | null;
  /** The game of the selected stand; `null` for a zone or a stand without a game. */
  game: Game | null;
  /** Whether the passport has a visit to the stand; `null` when the item is not a stand. */
  visited: boolean | null;
}

/** The panel beside the map: the game of the selected stand, the zone, or how to pick one. */
export function PassportGameDetail({ ref, item, game, visited }: Readonly<PassportGameDetailProps>) {
  return (
    <section
      ref={ref}
      aria-labelledby={HEADING_ID}
      aria-live="polite"
      className="flex min-w-0 scroll-mt-[calc(var(--spacing-nav)+16px)] flex-col gap-4 border border-border bg-background p-4 xl:p-5"
    >
      <h2 id={HEADING_ID} className="type-tiny text-foreground">
        {COPY.detailTitle}
      </h2>
      <DetailBody item={item} game={game} visited={visited} />
    </section>
  );
}

function DetailBody({ item, game, visited }: Readonly<Omit<PassportGameDetailProps, "ref">>) {
  if (!item) return <p className="text-sm/6 text-muted">{COPY.empty}</p>;

  if (game) return <GameSummary game={game} visited={visited} />;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="type-wide text-xl/tight wrap-break-word">{item.title}</h3>
      <VisitStatus visited={visited} />
      <p className="text-sm/6 text-copy">{item.description}</p>
    </div>
  );
}

function GameSummary({ game, visited }: Readonly<{ game: Game; visited: boolean | null }>) {
  return (
    <>
      <div className="flex gap-4">
        <div className="relative aspect-3/4 w-24 shrink-0 overflow-hidden border border-border bg-surface sm:w-28">
          <GameCoverImage game={game} sizes="112px" isDecorative />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="type-wide text-xl/tight wrap-break-word">{game.name}</h3>
          <p className="type-tiny text-muted">{GAMES_COPY.detail.meta(game)}</p>
          <VisitStatus visited={visited} />
        </div>
      </div>
      <p className="text-sm/6 text-copy">{game.synopsis}</p>
      <ActionLink href={getGamePath(game.slug)} variant="primary" arrow="e" fullWidth>
        {COPY.gameLink}
      </ActionLink>
    </>
  );
}

function VisitStatus({ visited }: Readonly<{ visited: boolean | null }>) {
  if (visited === null) return null;

  return (
    <p className={visited ? "type-tiny text-accent" : "type-tiny text-muted"}>
      {visited ? STANDS_COPY.visited : STANDS_COPY.pending}
    </p>
  );
}
