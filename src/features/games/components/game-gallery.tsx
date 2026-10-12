"use client";

import { cn } from "@heroui/react";
import { GameGalleryThumbnails } from "@features/games/components/game-gallery-thumbnails";
import { GameImageView } from "@features/games/components/game-image-view";
import { useGallery } from "@features/games/hooks/use-gallery";
import type { GalleryShot } from "@features/games/lib/game-gallery";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { ArrowButton } from "@shared/components/arrow-button";

interface GameGalleryProps {
  shots: readonly GalleryShot[];
}

const VIEWER_SIZES = "(max-width: 980px) 100vw, 1180px";

// Flechas sobre la imagen (`.g-nav` del diseño): variante `overlay`, centradas en vertical.
const NAV_BUTTON_CLASS = "absolute top-1/2 z-[2] size-[46px] -translate-y-1/2 max-[560px]:size-[38px]";

/**
 * Galería del detalle con miniaturas (`.gallery` y `.shots` del diseño). Con una sola foto (sólo
 * la portada) no muestra flechas ni miniaturas.
 */
export function GameGallery({ shots }: Readonly<GameGalleryProps>) {
  const { activeIndex, showShot, showPrevious, showNext, swipeHandlers } = useGallery(shots.length);
  const hasSeveralShots = shots.length > 1;

  return (
    <>
      <section
        aria-label={GAMES_COPY.detail.gallery}
        className="relative aspect-video max-w-full overflow-hidden bg-surface"
        {...swipeHandlers}
      >
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
              <GameImageView image={shot.image} alt={shot.image.alt} sizes={VIEWER_SIZES} preload={index === 0} />
            </div>
          ))}
        </div>
        {hasSeveralShots ? (
          <>
            <ArrowButton
              direction="previous"
              label={GAMES_COPY.detail.previousImage}
              tone="overlay"
              className={cn(NAV_BUTTON_CLASS, "left-3")}
              onPress={showPrevious}
            />
            <ArrowButton
              direction="next"
              label={GAMES_COPY.detail.nextImage}
              tone="overlay"
              className={cn(NAV_BUTTON_CLASS, "right-3")}
              onPress={showNext}
            />
          </>
        ) : null}
      </section>

      {hasSeveralShots ? <GameGalleryThumbnails shots={shots} activeIndex={activeIndex} onSelect={showShot} /> : null}
    </>
  );
}
