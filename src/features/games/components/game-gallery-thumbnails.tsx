"use client";

import { GameImageView } from "@features/games/components/game-image-view";
import type { GalleryShot } from "@features/games/lib/game-gallery";
import { GAMES_COPY } from "@features/games/lib/games-copy";

const THUMBNAIL_SIZES = "170px";

interface GameGalleryThumbnailsProps {
  shots: readonly GalleryShot[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Miniaturas de la galería (`.shots`): una pestaña por foto. */
export function GameGalleryThumbnails({ shots, activeIndex, onSelect }: Readonly<GameGalleryThumbnailsProps>) {
  return (
    <div
      role="tablist"
      aria-label={GAMES_COPY.detail.images}
      className="-mt-4 scrollbar-none grid auto-cols-[clamp(110px,16%,170px)] grid-flow-col gap-[10px] overflow-x-auto"
    >
      {shots.map((shot, index) => (
        <button
          key={shot.id}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={GAMES_COPY.detail.image(index + 1)}
          onClick={() => onSelect(index)}
          className="group relative aspect-video cursor-pointer overflow-hidden border border-border bg-surface p-0 aria-selected:border-accent"
        >
          <span className="absolute inset-0 brightness-[.55] transition-[filter] duration-[250ms] group-hover:brightness-[.85] group-aria-selected:brightness-100">
            <GameImageView image={shot.image} sizes={THUMBNAIL_SIZES} />
          </span>
        </button>
      ))}
    </div>
  );
}
