"use client";

import { ToggleButton } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import type { GenreSummary } from "@features/games/lib/types";
import { pluralize } from "@shared/lib/text";

interface GenreTileProps {
  genre: GenreSummary;
  isSelected: boolean;
  onSelect: (genre: string) => void;
}

// Posición de las tres portadas: dos al fondo (atenuadas) y la del frente al centro.
const COVER_SLOTS = [
  { id: "back-left", className: "left-[2%] scale-90 brightness-[.55] group-hover:translate-x-[-6%]" },
  { id: "back-right", className: "left-1/2 scale-90 brightness-[.55] group-hover:translate-x-[6%]" },
  {
    id: "front",
    className: "left-[26%] z-[2] shadow-[0_10px_30px_rgba(0,0,0,.7)] group-hover:translate-y-[-4px]",
  },
] as const;

/** Tarjeta de género del carrusel (`.gcat` del diseño). */
export function GenreTile({ genre, isSelected, onSelect }: Readonly<GenreTileProps>) {
  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={() => onSelect(genre.name)}
      className="group h-auto w-auto snap-start flex-col items-center gap-4 rounded-none border border-surface bg-surface px-[18px] pt-[22px] pb-[18px] font-sans text-base font-normal whitespace-normal text-foreground transition-[border-color,background-color] duration-200 hover:border-border active:transform-none data-[selected=true]:border-accent data-[selected=true]:bg-surface data-[selected=true]:text-foreground"
    >
      <div className="relative aspect-[16/10] w-full">
        {COVER_SLOTS.map((slot, index) => (
          <div
            key={slot.id}
            className={`absolute top-0 h-full w-[48%] overflow-hidden bg-background transition-transform duration-[350ms] ease-snap ${slot.className}`}
          >
            <GameMedia game={genre.covers[index]} sizes="(max-width: 760px) 36vw, (max-width: 1000px) 16vw, 12vw" />
          </div>
        ))}
      </div>
      <b className="font-wide text-sm tracking-[-.01em] uppercase group-data-[selected=true]:text-accent">
        {genre.name}
      </b>
      <span className="type-tiny text-muted">
        {genre.gameCount} {pluralize(genre.gameCount, "juego", "juegos")}
      </span>
    </ToggleButton>
  );
}
