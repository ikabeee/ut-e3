import { cn } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import type { Game } from "@features/games/lib/types";
import { wrapIndex } from "@shared/lib/math";

interface FeaturedSlidesProps {
  games: readonly Game[];
  current: number;
  /** Diapositiva anterior: sigue montada mientras se desvanece. */
  previous: number | null;
}

/**
 * Imágenes de fondo del carrusel de destacados con un fundido entre diapositivas y los
 * degradados para leer el título. Sólo se pintan la actual, la anterior y la siguiente.
 */
export function FeaturedSlides({ games, current, previous }: Readonly<FeaturedSlidesProps>) {
  const next = wrapIndex(current + 1, games.length);
  const isMounted = (index: number) => index === current || index === previous || index === next;

  return (
    <div className="absolute inset-0 -z-1">
      {games.map((slide, index) => {
        const isCurrent = index === current;
        return (
          <div
            key={slide.slug}
            aria-hidden={!isCurrent}
            className={cn(
              "absolute inset-0",
              isCurrent
                ? "visible opacity-100 [transition:opacity_.7s_ease]"
                : "invisible opacity-0 [transition:opacity_.7s_ease,visibility_0s_.7s]",
            )}
          >
            {isMounted(index) ? (
              <GameMedia
                game={slide}
                sizes="100vw"
                preload={index === 0}
                className={cn("transition-transform duration-[7s] ease-linear", isCurrent ? "scale-100" : "scale-[1.05]")}
              />
            ) : null}
          </div>
        );
      })}
      {/* Degradados sobre la imagen: a la izquierda y abajo en escritorio, sólo abajo en móvil. */}
      <div aria-hidden="true" className="shade-featured absolute inset-0 max-[760px]:hidden" />
      <div aria-hidden="true" className="shade-featured-mobile absolute inset-0 hidden max-[760px]:block" />
    </div>
  );
}
