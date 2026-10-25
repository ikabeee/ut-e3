import type { Ref } from "react";
import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { getCoverflowPlacement } from "@features/games/lib/coverflow-layout";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

const COVER_SIZES = "270px";

interface CoverflowCaseProps {
  ref: Ref<HTMLButtonElement>;
  game: Game;
  index: number;
  current: number;
  onSelect: (index: number) => void;
}

export function CoverflowCase({ ref, game, index, current, onSelect }: Readonly<CoverflowCaseProps>) {
  const placement = getCoverflowPlacement(index, current);

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={placement.isCurrent ? 0 : -1}
      aria-label={GAMES_COPY.coverflow.caseLabel(game)}
      aria-current={placement.isCurrent}
      onClick={() => onSelect(index)}
      className={cn(
        "absolute top-(--top) left-1/2 -ml-[calc(var(--cw)/2)] block h-(--ch) w-(--cw) cursor-pointer border-0 bg-transparent p-0 [transition:transform_.55s_cubic-bezier(.2,.8,.2,1),opacity_.4s,filter_.4s] transform-3d focus-visible:outline-none",
        placement.isCurrent ? "brightness-100" : "brightness-[.72] hover:brightness-[.95]",
      )}
      style={placement.style}
    >
      <CoverflowEdges />
      <CoverflowCover game={game} isCurrent={placement.isCurrent} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[calc(100%+4px)] left-0 block size-full transform-[scaleY(-1)] coverflow-reflection opacity-90"
      >
        <CoverflowCover game={game} isCurrent={placement.isCurrent} isReflection />
      </span>
    </button>
  );
}

interface CoverflowCoverProps {
  game: Game;
  isCurrent: boolean;
  isReflection?: boolean;
}

function CoverflowCover({ game, isCurrent, isReflection = false }: Readonly<CoverflowCoverProps>) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden border-2 border-case-border bg-case-face backface-hidden",
        isCurrent && "coverflow-glow",
        isCurrent && !isReflection && "border-foreground",
      )}
    >
      <span className="relative block flex-1 overflow-hidden bg-surface">
        <GameCoverImage game={game} sizes={COVER_SIZES} isDecorative={isReflection} />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 block h-[42%] shade-cover" />
        <span className="absolute inset-x-[10px] bottom-[10px] z-1 block text-left type-wide text-[calc(var(--cw)*0.085)] leading-none tracking-[-.03em] text-foreground">
          {game.name}
        </span>
      </span>
    </span>
  );
}

function CoverflowEdges() {
  const edgeClass = "coverflow-edge absolute top-0 block h-[var(--ch)] w-[var(--cd)] [backface-visibility:hidden]";

  return (
    <>
      <span aria-hidden="true" className={cn(edgeClass, "-left-(--cd) origin-right transform-[rotateY(-90deg)]")} />
      <span aria-hidden="true" className={cn(edgeClass, "left-full origin-left transform-[rotateY(90deg)]")} />
    </>
  );
}
