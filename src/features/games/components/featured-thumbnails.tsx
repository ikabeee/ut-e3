"use client";

import type { RefObject } from "react";
import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import type { Game } from "@features/games/lib/types";
import { useActiveThumbScroll } from "@shared/hooks/use-active-thumb-scroll";

interface FeaturedThumbnailsProps {
  games: Game[];
  current: number;
  onSelect: (index: number) => void;
  /** The autoplay progress bar, drawn on the current thumbnail. */
  progressBarRef: RefObject<HTMLElement | null>;
}

export function FeaturedThumbnails({ games, current, onSelect, progressBarRef }: Readonly<FeaturedThumbnailsProps>) {
  const trackRef = useActiveThumbScroll<HTMLDivElement>(current);

  return (
    <div
      ref={trackRef}
      className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto max-[760px]:h-29.5 max-[760px]:flex-none"
    >
      {games.map((game, index) => (
        <FeaturedThumbnail
          key={game.slug}
          game={game}
          isCurrent={index === current}
          onSelect={() => onSelect(index)}
          progressBarRef={progressBarRef}
        />
      ))}
    </div>
  );
}

interface FeaturedThumbnailProps {
  game: Game;
  isCurrent: boolean;
  onSelect: () => void;
  progressBarRef: RefObject<HTMLElement | null>;
}

function FeaturedThumbnail({ game, isCurrent, onSelect, progressBarRef }: Readonly<FeaturedThumbnailProps>) {
  return (
    <button
      type="button"
      aria-label={game.name}
      aria-current={isCurrent}
      onClick={onSelect}
      className={cn(
        "group relative aspect-16/10 h-full flex-none cursor-pointer snap-start overflow-hidden border bg-surface p-0 text-left text-foreground",
        isCurrent ? "border-accent" : "border-border",
      )}
    >
      <ThumbnailCover game={game} isCurrent={isCurrent} />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-2.5 bottom-2.5 z-1 type-wide text-[clamp(10px,.95vw,13px)] leading-[1.1] tracking-[-.02em]",
          isCurrent && "text-accent",
        )}
      >
        {game.name}
      </span>
      <i
        ref={isCurrent ? progressBarRef : undefined}
        aria-hidden="true"
        className="absolute top-0 left-0 z-1 h-0.75 bg-accent"
        style={isCurrent ? undefined : { width: 0 }}
      />
    </button>
  );
}

// The other thumbnails stay dimmed and gray until hovered.
function ThumbnailCover({ game, isCurrent }: Readonly<{ game: Game; isCurrent: boolean }>) {
  return (
    <>
      <GameCoverImage
        game={game}
        sizes="200px"
        isDecorative
        className={cn(
          "transition-[filter,transform] duration-300",
          !isCurrent &&
            "brightness-50 grayscale group-hover:scale-[1.04] group-hover:brightness-85 group-hover:grayscale-30",
        )}
      />
      <span aria-hidden="true" className="absolute inset-0 shade-thumb" />
    </>
  );
}
