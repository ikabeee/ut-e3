"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@heroui/react";
import { CoverflowCover, CoverflowEdges } from "@features/games/components/coverflow-case";
import { useCoverflow } from "@features/games/hooks/use-coverflow";
import { useGames } from "@features/games/hooks/use-games";
import { describeCoverflowPosition, getCoverflowPlacement } from "@features/games/lib/coverflow-layout";
import { getGamePath } from "@features/games/lib/game-links";
import { ArrowButton } from "@shared/components/arrow-button";

// Medidas del exhibidor (ver `coverflow-layout.ts`). Por debajo de 640 px de ancho cambian
// a las de teléfono. `--ch` alto de caja y `--cd` grosor de los cantos.
const RACK_VARIABLES = [
  "[--cw:clamp(190px,19cqw,270px)] [--top:44px] [--rack-pad:44px] [--gap-f:.9] [--step-f:.27] [--depth-f:.85] [--angle:60deg] [--persp-f:4.6]",
  "@max-[640px]:[--cw:min(190px,46cqw)] @max-[640px]:[--top:28px] @max-[640px]:[--rack-pad:28px] @max-[640px]:[--gap-f:.7] @max-[640px]:[--step-f:.2] @max-[640px]:[--depth-f:.7] @max-[640px]:[--angle:64deg] @max-[640px]:[--persp-f:4.2]",
  "[--ch:calc(var(--cw)*1.36)] [--cd:max(6px,calc(var(--cw)*.07))]",
].join(" ");

const RACK_BACKGROUND = "radial-gradient(70% 60% at 50% 38%,#1e1e20 0%,#0c0c0d 55%,#000 100%)";
const REFLECTION_MASK = "linear-gradient(to top,rgba(0,0,0,.38),transparent 46%)";
const PLATE_ARROW_CLASS =
  "size-14 border-background text-xl [--btn-base:var(--utg-black)] [--btn-edge:var(--utg-black)] [--btn-fill:var(--utg-white)] [--btn-ink-hover:var(--utg-black)] hover:border-white disabled:opacity-35";

/** Exhibidor 3D de la portada (`.fan`): cajas de juegos con reflejo, cantos y perspectiva. */
export function GameCoverflow() {
  const games = useGames();
  const router = useRouter();
  const coverflow = useCoverflow(games.length);
  const caseRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const focusCurrentAfterMove = useRef(false);
  const { current } = coverflow;
  const currentGame = games[current];

  // Al moverse con el teclado, el foco sigue a la caja del frente.
  useEffect(() => {
    if (focusCurrentAfterMove.current) {
      focusCurrentAfterMove.current = false;
      caseRefs.current[current]?.focus();
    }
  }, [current]);

  const handleCaseClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    // Una caja de lado primero gira al frente; la del frente abre el juego.
    if (index !== coverflow.current) {
      event.preventDefault();
      coverflow.goTo(index);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " && event.target instanceof HTMLAnchorElement) {
      event.preventDefault();
      router.push(getGamePath(currentGame.slug));
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      focusCurrentAfterMove.current = true;
      if (event.key === "ArrowRight") {
        coverflow.goNext();
      } else {
        coverflow.goPrevious();
      }
    }
  };

  return (
    <div className="@container">
      <div
        aria-roledescription="carrusel"
        aria-label="Juegos en el exhibidor"
        onKeyDown={handleKeyDown}
        className={cn(
          RACK_VARIABLES,
          "relative mt-[clamp(8px,2vw,24px)] h-[calc(var(--top)+var(--ch)*1.13+56px+var(--rack-pad))] touch-pan-y overflow-hidden [perspective-origin:50%_calc(var(--top)+var(--ch)/2)] [perspective:calc(var(--cw)*var(--persp-f))]",
          "after:pointer-events-none after:absolute after:inset-x-0 after:top-[calc(var(--top)+var(--ch)+2px)] after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)] after:content-['']",
        )}
        style={{ background: RACK_BACKGROUND }}
        {...coverflow.swipeHandlers}
      >
        {games.map((game, index) => {
          const placement = getCoverflowPlacement(index, coverflow.current);
          return (
            <Link
              key={game.slug}
              ref={(element) => {
                caseRefs.current[index] = element;
              }}
              href={getGamePath(game.slug)}
              tabIndex={placement.isCurrent ? 0 : -1}
              aria-label={`${game.name}, ${game.genre}, stand ${game.stand}`}
              aria-current={placement.isCurrent}
              onClick={(event) => handleCaseClick(event, index)}
              className={cn(
                "absolute top-[var(--top)] left-1/2 -ml-[calc(var(--cw)/2)] block h-[var(--ch)] w-[var(--cw)] cursor-pointer [transform-style:preserve-3d] [transition:transform_.55s_cubic-bezier(.2,.8,.2,1),opacity_.4s,filter_.4s] focus-visible:outline-none",
                placement.isCurrent ? "brightness-100" : "brightness-[.72] hover:brightness-[.95]",
              )}
              style={placement.style}
            >
              <CoverflowEdges />
              <CoverflowCover game={game} isCurrent={placement.isCurrent} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-[calc(100%+4px)] left-0 size-full [transform:scaleY(-1)] opacity-90"
                style={{ maskImage: REFLECTION_MASK, WebkitMaskImage: REFLECTION_MASK }}
              >
                <CoverflowCover game={game} isCurrent={placement.isCurrent} isReflection />
              </div>
            </Link>
          );
        })}

        <div className="absolute top-[calc(var(--top)+var(--ch)*1.13)] left-1/2 z-[300] flex -translate-x-1/2 gap-3">
          <ArrowButton
            direction="previous"
            label="Juego anterior"
            className={PLATE_ARROW_CLASS}
            isDisabled={coverflow.isFirst}
            onPress={coverflow.goPrevious}
          />
          <div className="sr-only" aria-live="polite">
            <h3>{currentGame.name}</h3>
            <span>{describeCoverflowPosition(coverflow.current, games.length)}</span>
          </div>
          <ArrowButton
            direction="next"
            label="Juego siguiente"
            className={PLATE_ARROW_CLASS}
            isDisabled={coverflow.isLast}
            onPress={coverflow.goNext}
          />
        </div>
      </div>
    </div>
  );
}
