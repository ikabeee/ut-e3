import Image from "next/image";
import type { KeyboardEvent } from "react";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { GameImage } from "@features/games/lib/types";

const THUMBNAIL_SIZES = "170px";

interface GameGalleryThumbnailsProps {
  images: GameImage[];
  viewerId: string;
  activeIndex: number;
  onSelect: (index: number) => void;
  tabRef: (index: number) => (element: HTMLElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

// The tab names the image, so the thumbnail itself is decorative.
export function GameGalleryThumbnails({
  images,
  viewerId,
  activeIndex,
  onSelect,
  tabRef,
  onKeyDown,
}: Readonly<GameGalleryThumbnailsProps>) {
  return (
    <div
      role="tablist"
      aria-label={GAMES_COPY.detail.galleryImages}
      className="scrollbar-none grid auto-cols-[clamp(110px,16%,170px)] grid-flow-col gap-2.5 overflow-x-auto"
    >
      {images.map((image, index) => (
        <button
          key={image.path}
          ref={tabRef(index)}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-controls={viewerId}
          aria-label={GAMES_COPY.detail.image(index + 1)}
          tabIndex={index === activeIndex ? 0 : -1}
          onClick={() => onSelect(index)}
          onKeyDown={onKeyDown}
          className="group relative aspect-video cursor-pointer overflow-hidden border border-border bg-surface p-0 aria-selected:border-accent"
        >
          <Image
            src={image.path}
            alt=""
            fill
            sizes={THUMBNAIL_SIZES}
            className="object-cover brightness-55 transition-[filter] duration-250 group-hover:brightness-85 group-aria-selected:brightness-100"
          />
        </button>
      ))}
    </div>
  );
}
