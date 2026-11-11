import Link from "next/link";
import type { MouseEvent, Ref } from "react";
import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { getCoverflowPlacement } from "@features/games/lib/coverflow-layout";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_SECTION_ID, getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";

const COVER_SIZES = "360px";

interface CoverflowCaseProps {
  ref: Ref<HTMLAnchorElement>;
  game: Game;
  index: number;
  current: number;
  onSelect: (index: number) => void;
  linksToGamePage?: boolean;
}

export function CoverflowCase({
  ref,
  game,
  index,
  current,
  onSelect,
  linksToGamePage = true,
}: Readonly<CoverflowCaseProps>) {
  const placement = getCoverflowPlacement(index, current);
  const opensGamePage = placement.isCurrent && linksToGamePage;

  // The case at the center opens the game page; a side case turns to the center first.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (opensGamePage) return;

    event.preventDefault();
    onSelect(index);
  };

  return (
    <Link
      ref={ref}
      href={linksToGamePage ? getGamePath(game.slug) : `#${GAMES_SECTION_ID}`}
      tabIndex={placement.isCurrent ? 0 : -1}
      aria-label={GAMES_COPY.coverflow.caseLabel(game)}
      aria-current={placement.isCurrent}
      onClick={handleClick}
      className="group absolute top-(--top) left-1/2 -ml-[calc(var(--cw)/2)] block h-(--ch) w-(--cw) cursor-pointer border-0 bg-transparent p-0 [transition:transform_.55s_cubic-bezier(.2,.8,.2,1),opacity_.4s]"
      style={placement.style}
    >
      <CoverflowCover game={game} isCurrent={placement.isCurrent} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[calc(100%+4px)] left-0 block size-full transform-[scaleY(-1)] coverflow-reflection"
      >
        <CoverflowCover game={game} isCurrent={placement.isCurrent} isReflection />
      </span>
    </Link>
  );
}

interface CoverflowCoverProps {
  game: Game;
  isCurrent: boolean;
  isReflection?: boolean;
}

// The shade is a sibling of the case, not a child, because the case clips its children to the inside of its border.
// `isolate` keeps the title's z-index inside the case, so the shade also dims the title.
function CoverflowCover({ game, isCurrent, isReflection = false }: Readonly<CoverflowCoverProps>) {
  return (
    <>
      <span
        className={cn(
          "absolute inset-0 isolate flex flex-col overflow-hidden border-2 border-case-border bg-case-face",
          isCurrent && "coverflow-glow",
          isCurrent && !isReflection && "border-foreground",
        )}
      >
        <span className="relative block flex-1 overflow-hidden bg-surface">
          <GameCoverImage game={game} sizes={COVER_SIZES} isDecorative={isReflection} isTitleShown={false} />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 block h-[42%] shade-cover" />
          <span className="absolute inset-x-[10px] bottom-[10px] z-1 block text-left type-wide text-[calc(var(--cw)*0.085)] leading-none tracking-[-.03em] text-foreground">
            {game.name}
          </span>
        </span>
      </span>
      <CoverflowShade isCurrent={isCurrent} />
    </>
  );
}

// Dims a side case like brightness(.72) would, but with a black layer: a CSS filter on each of the cases made the
// browser redraw every case as its own surface on each scrolled frame, which lagged the whole section (issue #128).
function CoverflowShade({ isCurrent }: Readonly<{ isCurrent: boolean }>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 block bg-black transition-opacity duration-400",
        isCurrent ? "opacity-0" : "opacity-28 group-hover:opacity-5",
      )}
    />
  );
}
