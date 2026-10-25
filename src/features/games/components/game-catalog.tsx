"use client";

import { cn } from "@heroui/react";
import { CoverflowCase } from "@features/games/components/coverflow-case";
import { CoverflowPlate } from "@features/games/components/coverflow-plate";
import { useCoverflow } from "@features/games/hooks/use-coverflow";
import { useCoverflowKeyboard } from "@features/games/hooks/use-coverflow-keyboard";
import { GAMES_SECTION_ID } from "@features/games/lib/games-links";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

const RACK_VARIABLES = [
  "[--cw:clamp(190px,19cqw,270px)] [--top:44px] [--rack-pad:44px] [--gap-f:.9] [--step-f:.27] [--depth-f:.85] [--angle:60deg] [--persp-f:4.6]",
  "@max-[640px]:[--cw:min(190px,46cqw)] @max-[640px]:[--top:28px] @max-[640px]:[--rack-pad:28px] @max-[640px]:[--gap-f:.7] @max-[640px]:[--step-f:.2] @max-[640px]:[--depth-f:.7] @max-[640px]:[--angle:64deg] @max-[640px]:[--persp-f:4.2]",
  "[--ch:calc(var(--cw)*1.36)] [--cd:max(6px,calc(var(--cw)*.07))]",
].join(" ");

interface GameCatalogProps {
  games: Game[];
}

export function GameCatalog({ games }: Readonly<GameCatalogProps>) {
  return (
    <section id={GAMES_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="text-center type-giant text-[clamp(24px,4.6vw,68px)]">{GAMES_COPY.catalog.heading}</h2>
      </div>
      {games.length > 0 ? <Coverflow games={games} /> : null}
    </section>
  );
}

function Coverflow({ games }: Readonly<GameCatalogProps>) {
  const coverflow = useCoverflow(games.length);
  const keyboard = useCoverflowKeyboard(coverflow);

  return (
    <div className="@container">
      <div
        aria-roledescription={GAMES_COPY.carousel.roleDescription}
        aria-label={GAMES_COPY.coverflow.label}
        onKeyDown={keyboard.onKeyDown}
        className={cn(
          RACK_VARIABLES,
          "coverflow-rack relative mt-[clamp(8px,2vw,24px)] h-[calc(var(--top)+var(--ch)*1.13+56px+var(--rack-pad))] touch-pan-y overflow-hidden perspective-[calc(var(--cw)*var(--persp-f))] perspective-origin-[50%_calc(var(--top)+var(--ch)/2)]",
        )}
        {...coverflow.swipeHandlers}
      >
        {games.map((game, index) => (
          <CoverflowCase
            key={game.id}
            ref={keyboard.caseRef(index)}
            game={game}
            index={index}
            current={coverflow.current}
            onSelect={coverflow.goTo}
          />
        ))}
        <CoverflowPlate
          game={games[coverflow.current]}
          current={coverflow.current}
          count={games.length}
          onPrevious={coverflow.goPrevious}
          onNext={coverflow.goNext}
          isFirst={coverflow.isFirst}
          isLast={coverflow.isLast}
        />
      </div>
    </div>
  );
}
