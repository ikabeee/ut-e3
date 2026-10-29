"use client";

import Link from "next/link";
import { Fragment, useRef } from "react";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";
import { useFitText } from "@shared/hooks/use-fit-text";

// The title shrinks until its widest word fits, and each word rises in when the game changes.
export function FeaturedCaption({ game }: Readonly<{ game: Game }>) {
  const titleRef = useRef<HTMLAnchorElement>(null);
  useFitText(titleRef, game.name);

  return (
    <div className="absolute inset-x-gutter bottom-[clamp(20px,3vw,40px)] flex max-w-[min(760px,100%)] flex-col gap-4.5">
      <h2 key={game.slug} className="type-wide text-[clamp(44px,7.4vw,132px)] leading-[.92] tracking-tighter">
        <Link ref={titleRef} href={getGamePath(game.slug)} className="text-foreground no-underline hover:text-accent">
          {game.name.split(" ").map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              {index > 0 ? " " : null}
              <span className="inline-block animate-rise whitespace-nowrap">{word}</span>
            </Fragment>
          ))}
        </Link>
      </h2>
      <p className="m-0 max-w-[42ch] text-[clamp(16px,1.3vw,19px)] leading-[1.35] text-copy">{game.synopsis}</p>
    </div>
  );
}
