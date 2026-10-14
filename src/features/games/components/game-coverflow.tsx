"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@heroui/react";
import { CoverflowCover, CoverflowEdges } from "@features/games/components/coverflow-case";
import { useCoverflow } from "@features/games/hooks/use-coverflow";
import { useCoverflowKeyboard } from "@features/games/hooks/use-coverflow-keyboard";
import { useGames } from "@features/games/hooks/use-games";
import { getCoverflowPlacement } from "@features/games/lib/coverflow-layout";
import { getGamePath } from "@features/games/lib/game-links";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

// Medidas del exhibidor (ver `coverflow-layout.ts`). Por debajo de 640 px de ancho cambian
// a las de teléfono. `--ch` alto de caja y `--cd` grosor de los cantos.
const RACK_VARIABLES = [
  "[--cw:clamp(190px,19cqw,270px)] [--top:44px] [--rack-pad:44px] [--gap-f:.9] [--step-f:.27] [--depth-f:.85] [--angle:60deg] [--persp-f:4.6]",
  "@max-[640px]:[--cw:min(190px,46cqw)] @max-[640px]:[--top:28px] @max-[640px]:[--rack-pad:28px] @max-[640px]:[--gap-f:.7] @max-[640px]:[--step-f:.2] @max-[640px]:[--depth-f:.7] @max-[640px]:[--angle:64deg] @max-[640px]:[--persp-f:4.2]",
  "[--ch:calc(var(--cw)*1.36)] [--cd:max(6px,calc(var(--cw)*.07))]",
].join(" ");

/**
 * Exhibidor 3D de la portada (`.fan`): cajas de juegos con reflejo, cantos y perspectiva. Mientras
 * no haya juegos publicados (base de datos recién creada) no se muestra.
 */
export function GameCoverflow() {
  const router = useRouter();

  return <GameCoverflowContent navigate={(path) => router.push(path)} />;
}

interface GameCoverflowContentProps {
  navigate(path: string): void;
}

export function GameCoverflowContent({ navigate }: Readonly<GameCoverflowContentProps>) {
  const games = useGames();

  if (games.length === 0) return null;

  return <CoverflowRack games={games} navigate={navigate} />;
}

interface CoverflowRackProps {
  games: readonly Game[];
  navigate(path: string): void;
}

function CoverflowRack({ games, navigate }: Readonly<CoverflowRackProps>) {
  const coverflow = useCoverflow(games.length);
  const currentGame = games[coverflow.current];

  const keyboard = useCoverflowKeyboard({
    current: coverflow.current,
    goNext: coverflow.goNext,
    goPrevious: coverflow.goPrevious,
    onOpenCurrent: () => navigate(getGamePath(currentGame.slug)),
  });

  const handleCaseClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    // Una caja de lado primero gira al frente; la del frente abre el juego.
    if (index !== coverflow.current) {
      event.preventDefault();
      coverflow.goTo(index);
    }
  };

  return (
    <div className="@container">
      <div
        aria-roledescription={GAMES_COPY.carousel.roleDescription}
        aria-label={GAMES_COPY.coverflow.label}
        onKeyDown={keyboard.onKeyDown}
        className={cn(
          RACK_VARIABLES,
          "coverflow-rack relative mt-[clamp(8px,2vw,24px)] h-[calc(var(--top)+var(--ch)*1.13+56px+var(--rack-pad))] touch-pan-y overflow-hidden [perspective-origin:50%_calc(var(--top)+var(--ch)/2)] [perspective:calc(var(--cw)*var(--persp-f))]",
        )}
        {...coverflow.swipeHandlers}
      >
        {games.map((game, index) => {
          const placement = getCoverflowPlacement(index, coverflow.current);

          return (
            <Link
              key={game.slug}
              ref={keyboard.caseRef(index)}
              href={getGamePath(game.slug)}
              tabIndex={placement.isCurrent ? 0 : -1}
              aria-label={GAMES_COPY.coverflow.caseLabel(game)}
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
                className="pointer-events-none absolute top-[calc(100%+4px)] left-0 size-full [transform:scaleY(-1)] coverflow-reflection opacity-90"
              >
                <CoverflowCover game={game} isCurrent={placement.isCurrent} isReflection />
              </div>
            </Link>
          );
        })}

        <div className="absolute top-[calc(var(--top)+var(--ch)*1.13)] left-1/2 z-[300] flex -translate-x-1/2 gap-3">
          <ArrowButton
            direction="previous"
            label={GAMES_COPY.carousel.previous}
            tone="plate"
            className="size-14"
            isDisabled={coverflow.isFirst}
            onPress={coverflow.goPrevious}
          />
          <div className="sr-only" aria-live="polite">
            <h3>{currentGame.name}</h3>
            <span>{GAMES_COPY.coverflow.position(coverflow.current, games.length)}</span>
          </div>
          <ArrowButton
            direction="next"
            label={GAMES_COPY.carousel.next}
            tone="plate"
            className="size-14"
            isDisabled={coverflow.isLast}
            onPress={coverflow.goNext}
          />
        </div>
      </div>
    </div>
  );
}
