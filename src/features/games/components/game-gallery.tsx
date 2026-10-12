"use client";

import { cn } from "@heroui/react";
import { GameArtwork } from "@features/games/components/game-artwork";
import { useGallery } from "@features/games/hooks/use-gallery";
import type { ArtLabels } from "@features/games/lib/game-art";
import type { GalleryShot } from "@features/games/lib/game-gallery";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { ArrowButton } from "@shared/components/arrow-button";

interface GameGalleryProps {
  gameName: string;
  shots: readonly GalleryShot[];
  labels: ArtLabels;
}

const VIEWER_SIZES = "(max-width: 980px) 100vw, 1180px";
const THUMBNAIL_SIZES = "170px";

// Flechas sobre la imagen (`.g-nav` del diseño): variante `overlay`, centradas en vertical.
const NAV_BUTTON_CLASS = "absolute top-1/2 z-[2] size-[46px] -translate-y-1/2 max-[560px]:size-[38px]";

/** Galería del detalle con miniaturas (`.gallery` y `.shots` del diseño). */
export function GameGallery({ gameName, shots, labels }: Readonly<GameGalleryProps>) {
  const { activeIndex, showShot, showPrevious, showNext, swipeHandlers } = useGallery(shots.length);

  return (
    <>
      <section aria-label={GAMES_COPY.detail.gallery} className="relative aspect-video max-w-full overflow-hidden bg-surface" {...swipeHandlers}>
        <div className="absolute inset-0">
          {shots.map((shot, index) => (
            <div
              key={shot.id}
              aria-hidden={index !== activeIndex}
              className={cn(
                "absolute inset-0 opacity-0 transition-opacity duration-[450ms] ease-[ease]",
                index === activeIndex && "opacity-100",
              )}
            >
              <GameArtwork
                visual={shot}
                labels={labels}
                alt={index === 0 ? gameName : ""}
                sizes={VIEWER_SIZES}
                preload={index === 0}
              />
            </div>
          ))}
        </div>
        <ArrowButton direction="previous" label={GAMES_COPY.detail.previousImage} tone="overlay" className={cn(NAV_BUTTON_CLASS, "left-3")} onPress={showPrevious} />
        <ArrowButton direction="next" label={GAMES_COPY.detail.nextImage} tone="overlay" className={cn(NAV_BUTTON_CLASS, "right-3")} onPress={showNext} />
      </section>

      <div
        role="tablist"
        aria-label={GAMES_COPY.detail.images}
        className="scrollbar-none -mt-4 grid auto-cols-[clamp(110px,16%,170px)] grid-flow-col gap-[10px] overflow-x-auto"
      >
        {shots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={GAMES_COPY.detail.image(index + 1)}
            onClick={() => showShot(index)}
            className="group relative aspect-video cursor-pointer overflow-hidden border border-border bg-surface p-0 aria-selected:border-accent"
          >
            <span className="absolute inset-0 brightness-[.55] transition-[filter] duration-[250ms] group-hover:brightness-[.85] group-aria-selected:brightness-100">
              <GameArtwork visual={shot} labels={labels} sizes={THUMBNAIL_SIZES} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
