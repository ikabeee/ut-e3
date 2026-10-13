"use client";

import type { RefObject } from "react";
import { cn } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import { useActiveThumbScroll } from "@features/games/hooks/use-active-thumb-scroll";
import type { Game } from "@features/games/lib/types";

interface FeaturedThumbnailsProps {
  games: readonly Game[];
  current: number;
  onSelect: (index: number) => void;
  /** Barra de progreso del avance automático; va en la miniatura activa. */
  progressBarRef: RefObject<HTMLElement | null>;
}

/** Tira de miniaturas del carrusel: la activa en azul, con la barra de progreso y siempre a la vista. */
export function FeaturedThumbnails({ games, current, onSelect, progressBarRef }: Readonly<FeaturedThumbnailsProps>) {
  const trackRef = useActiveThumbScroll<HTMLDivElement>(current);

  return (
    <div
      ref={trackRef}
      className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory gap-[10px] overflow-x-auto max-[760px]:h-[118px] max-[760px]:flex-none"
    >
      {games.map((thumb, index) => {
        const isCurrent = index === current;

        return (
          <button
            key={thumb.slug}
            type="button"
            aria-label={thumb.name}
            aria-current={isCurrent}
            onClick={() => onSelect(index)}
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
                !isCurrent &&
                  "brightness-50 grayscale group-hover:scale-[1.04] group-hover:brightness-[.85] group-hover:grayscale-[.3]",
              )}
            />
            <span aria-hidden="true" className="absolute inset-0 shade-thumb" />
            <span
              className={cn(
                "absolute right-[10px] bottom-[10px] left-[10px] z-[1] font-wide text-[clamp(10px,.95vw,13px)] leading-[1.1] font-bold tracking-[-.02em] uppercase",
                isCurrent && "text-accent",
              )}
            >
              {thumb.name}
            </span>
            <i
              ref={isCurrent ? progressBarRef : undefined}
              aria-hidden="true"
              className="absolute top-0 left-0 z-[1] h-[3px] bg-accent"
              style={isCurrent ? undefined : { width: 0 }}
            />
          </button>
        );
      })}
    </div>
  );
}
