"use client";

import { Fragment, useEffect, useRef } from "react";
import { cn } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import { useFeaturedCarousel } from "@features/games/hooks/use-featured-carousel";
import { useGames } from "@features/games/hooks/use-games";
import { wrapIndex } from "@shared/lib/math";
import { ArrowButton } from "@shared/components/arrow-button";
import { useFitText } from "@shared/hooks/use-fit-text";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

// Degradados sobre la imagen: a la izquierda y abajo en escritorio, sólo abajo en móvil.
const DESKTOP_SHADE =
  "linear-gradient(90deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.45) 40%,rgba(0,0,0,0) 70%),linear-gradient(0deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,0) 50%)";
const MOBILE_SHADE = "linear-gradient(0deg,#000 0%,rgba(0,0,0,.75) 40%,rgba(0,0,0,0) 75%)";
const THUMB_SHADE = "linear-gradient(0deg,rgba(0,0,0,.75),rgba(0,0,0,0) 60%)";

/** Espacio que se deja a la izquierda de la miniatura activa al desplazarse. */
const THUMB_SCROLL_OFFSET = 8;

/** Carrusel de destacados de la portada (`.hero`): imagen grande, título y miniaturas. */
export function FeaturedGamesCarousel() {
  const games = useGames();
  const carousel = useFeaturedCarousel(games.length);
  const { current } = carousel;
  const game = games[current];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  useFitText(titleRef, game.name);

  // La miniatura activa se desplaza a la vista.
  useEffect(() => {
    const track = thumbsRef.current;
    const thumb = track?.children[current];
    if (track && thumb instanceof HTMLElement) {
      track.scrollTo({
        left: thumb.offsetLeft - track.offsetLeft - THUMB_SCROLL_OFFSET,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [current, prefersReducedMotion]);

  // Sólo se pintan la diapositiva actual, la anterior (se desvanece) y la siguiente.
  const isMounted = (index: number) =>
    index === carousel.current ||
    index === carousel.previous ||
    index === wrapIndex(carousel.current + 1, games.length);

  return (
    <header
      id="destacados"
      aria-roledescription="carrusel"
      aria-label="Juegos del showcase"
      className="grid h-[clamp(640px,calc(100svh-56px),1000px)] grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,7fr)_minmax(0,3fr)] bg-background max-[760px]:h-auto max-[760px]:grid-rows-[auto_auto]"
      {...carousel.pauseHandlers}
    >
      <div
        className="relative isolate min-h-0 overflow-hidden max-[760px]:h-[clamp(480px,72svh,640px)]"
        {...carousel.swipeHandlers}
      >
        <div className="absolute inset-0 -z-1">
          {games.map((slide, index) => {
            const isCurrent = index === carousel.current;
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
          <div aria-hidden="true" className="absolute inset-0 max-[760px]:hidden" style={{ background: DESKTOP_SHADE }} />
          <div aria-hidden="true" className="absolute inset-0 hidden max-[760px]:block" style={{ background: MOBILE_SHADE }} />
        </div>

        <div className="absolute right-gutter bottom-[clamp(20px,3vw,40px)] left-gutter flex max-w-[min(760px,100%)] flex-col gap-[18px]">
          <h2
            ref={titleRef}
            key={game.slug}
            className="font-wide text-[clamp(44px,7.4vw,132px)] leading-[.92] font-bold tracking-[-.05em] uppercase"
          >
            {game.name.split(" ").map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                {index > 0 ? " " : null}
                <span className="inline-block animate-rise whitespace-nowrap">{word}</span>
              </Fragment>
            ))}
          </h2>
          <p className="m-0 max-w-[42ch] text-[clamp(16px,1.3vw,19px)] leading-[1.35] text-copy">{game.description}</p>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-[10px] border-t border-separator px-gutter pt-[14px] pb-4">
        <div
          ref={thumbsRef}
          className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory gap-[10px] overflow-x-auto max-[760px]:h-[118px] max-[760px]:flex-none"
        >
          {games.map((thumb, index) => {
            const isCurrent = index === carousel.current;
            return (
              <button
                key={thumb.slug}
                type="button"
                aria-label={thumb.name}
                aria-current={isCurrent}
                onClick={() => carousel.goTo(index)}
                className={cn(
                  "group relative aspect-[16/10] h-full flex-none cursor-pointer snap-start overflow-hidden border bg-surface p-0 text-left text-foreground",
                  isCurrent ? "border-accent" : "border-border",
                )}
              >
                <GameMedia
                  game={thumb}
                  sizes="200px"
                  className={cn(
                    "transition-[filter,transform] duration-300",
                    !isCurrent && "brightness-50 grayscale group-hover:scale-[1.04] group-hover:brightness-[.85] group-hover:grayscale-[.3]",
                  )}
                />
                <span aria-hidden="true" className="absolute inset-0" style={{ background: THUMB_SHADE }} />
                <span
                  className={cn(
                    "absolute right-[10px] bottom-[10px] left-[10px] z-[1] font-wide text-[clamp(10px,.95vw,13px)] leading-[1.1] font-bold tracking-[-.02em] uppercase",
                    isCurrent && "text-accent",
                  )}
                >
                  {thumb.name}
                </span>
                <i
                  ref={isCurrent ? carousel.progressBarRef : undefined}
                  aria-hidden="true"
                  className="absolute top-0 left-0 z-[1] h-[3px] bg-accent"
                  style={isCurrent ? undefined : { width: 0 }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-start gap-[10px]">
          <div className="flex [&>*+*]:border-l-0">
            <ArrowButton direction="previous" label="Juego anterior" onPress={carousel.goPrevious} />
            <ArrowButton direction="next" label="Juego siguiente" onPress={carousel.goNext} />
          </div>
        </div>
      </div>
    </header>
  );
}
