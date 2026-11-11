"use client";

import { GenreTile } from "@features/games/components/genre-tile";
import type { GenreSummary } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";
import { useHorizontalScroll } from "@shared/hooks/use-horizontal-scroll";

interface GenreRailProps {
  genres: readonly GenreSummary[];
  selectedGenre: string | null;
  onSelectGenre: (genre: string) => void;
}

// Las flechas avanzan dos géneros a la vez.
const GENRES_PER_STEP = 2;

/** Carrusel de géneros con flechas (`.genres` / `.grail` del diseño). */
export function GenreRail({ genres, selectedGenre, onSelectGenre }: Readonly<GenreRailProps>) {
  const { ref, scrollByItems } = useHorizontalScroll<HTMLDivElement>(GENRES_PER_STEP);

  return (
    <section aria-labelledby="genres-heading">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <h1
          id="genres-heading"
          className="font-wide text-[clamp(24px,3.4vw,46px)] leading-[.95] font-bold tracking-[-.03em] uppercase"
        >
          Géneros
        </h1>
        <div className="flex [&>*+*]:border-l-0">
          <ArrowButton direction="previous" label="Géneros anteriores" className="h-10" onPress={() => scrollByItems(-1)} />
          <ArrowButton direction="next" label="Más géneros" className="h-10" onPress={() => scrollByItems(1)} />
        </div>
      </div>
      <div
        ref={ref}
        className="scrollbar-none grid snap-x snap-mandatory auto-cols-[calc((100%-3*16px)/4)] grid-flow-col gap-4 overflow-x-auto pb-1 max-[1000px]:auto-cols-[calc((100%-2*16px)/3)] max-[760px]:auto-cols-[72%]"
      >
        {genres.map((genre) => (
          <GenreTile
            key={genre.name}
            genre={genre}
            isSelected={genre.name === selectedGenre}
            onSelect={onSelectGenre}
          />
        ))}
      </div>
    </section>
  );
}
