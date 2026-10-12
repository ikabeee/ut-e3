"use client";

import { Fragment, useRef } from "react";
import type { Game } from "@features/games/lib/types";
import { useFitText } from "@shared/hooks/use-fit-text";

interface FeaturedCaptionProps {
  game: Game;
}

/**
 * Título y descripción del juego destacado. El título se ajusta al ancho disponible y cada
 * palabra entra con `animate-rise` al cambiar de juego.
 */
export function FeaturedCaption({ game }: Readonly<FeaturedCaptionProps>) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useFitText(titleRef, game.name);

  return (
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
  );
}
