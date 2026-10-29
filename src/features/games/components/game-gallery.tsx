"use client";

import Image from "next/image";
import { useId } from "react";
import { cn } from "@heroui/react";
import { GameGalleryThumbnails } from "@features/games/components/game-gallery-thumbnails";
import { useGallery } from "@features/games/hooks/use-gallery";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { GameImage } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

const VIEWER_SIZES = "(min-width: 980px) 70vw, 100vw";

const ARROW_CLASS = "absolute top-1/2 z-2 size-[38px] -translate-y-1/2 sm:size-[46px]";

interface GameGalleryProps {
  images: GameImage[];
}

// A game with a single image shows it alone: no arrows and no thumbnails.
export function GameGallery({ images }: Readonly<GameGalleryProps>) {
  const viewerId = useId();
  const gallery = useGallery(images.length);
  const activeImage = images[gallery.activeIndex];
  const hasSeveralImages = images.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <section
        id={viewerId}
        aria-label={GAMES_COPY.detail.gallery}
        className="relative aspect-video overflow-hidden bg-surface"
        {...gallery.swipeHandlers}
      >
        <Image
          key={activeImage.path}
          src={activeImage.path}
          alt={activeImage.alt}
          fill
          sizes={VIEWER_SIZES}
          preload={gallery.activeIndex === 0}
          className="object-cover"
        />
        {hasSeveralImages ? <GalleryArrows onPrevious={gallery.showPrevious} onNext={gallery.showNext} /> : null}
      </section>
      {hasSeveralImages ? (
        <GameGalleryThumbnails
          images={images}
          viewerId={viewerId}
          activeIndex={gallery.activeIndex}
          onSelect={gallery.showImage}
          tabRef={gallery.tabRef}
          onKeyDown={gallery.onTabKeyDown}
        />
      ) : null}
    </div>
  );
}

function GalleryArrows({ onPrevious, onNext }: Readonly<{ onPrevious: () => void; onNext: () => void }>) {
  return (
    <>
      <ArrowButton
        direction="previous"
        label={GAMES_COPY.detail.previousImage}
        tone="overlay"
        className={cn(ARROW_CLASS, "left-3")}
        onPress={onPrevious}
      />
      <ArrowButton
        direction="next"
        label={GAMES_COPY.detail.nextImage}
        tone="overlay"
        className={cn(ARROW_CLASS, "right-3")}
        onPress={onNext}
      />
    </>
  );
}
