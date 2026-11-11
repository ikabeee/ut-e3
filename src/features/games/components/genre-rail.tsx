"use client";

import { ToggleButton } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { useHorizontalScroll } from "@features/games/hooks/use-horizontal-scroll";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { GenreSummary } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

interface GenreRailProps {
  genres: GenreSummary[];
  selectedGenreSlug: string | null;
  onSelectGenre: (genreSlug: string) => void;
}

const GENRES_PER_STEP = 2;

// Two dimmed covers at the back and the genre's first game in front, in the order of GenreSummary.covers.
const COVER_SLOTS = [
  { id: "back-left", className: "left-[2%] scale-90 brightness-[.55] group-hover:translate-x-[-6%]" },
  { id: "back-right", className: "left-1/2 scale-90 brightness-[.55] group-hover:translate-x-[6%]" },
  { id: "front", className: "left-[26%] z-2 shadow-cover group-hover:translate-y-[-4px]" },
];

export function GenreRail({ genres, selectedGenreSlug, onSelectGenre }: Readonly<GenreRailProps>) {
  const { ref, scrollByItems } = useHorizontalScroll<HTMLDivElement>(GENRES_PER_STEP);

  return (
    <section aria-labelledby="genres-heading">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <h2 id="genres-heading" className="type-wide text-[clamp(24px,3.4vw,46px)] leading-[.95] tracking-[-.03em]">
          {GAMES_COPY.catalog.genresHeading}
        </h2>
        <div className="flex [&>*+*]:border-l-0">
          <ArrowButton
            direction="previous"
            label={GAMES_COPY.catalog.previousGenres}
            onPress={() => scrollByItems(-1)}
          />
          <ArrowButton direction="next" label={GAMES_COPY.catalog.nextGenres} onPress={() => scrollByItems(1)} />
        </div>
      </div>
      <div
        ref={ref}
        className="scrollbar-none grid snap-x snap-mandatory auto-cols-[calc((100%-3*16px)/4)] grid-flow-col gap-4 overflow-x-auto pb-1 max-[1000px]:auto-cols-[calc((100%-2*16px)/3)] max-[760px]:auto-cols-[72%]"
      >
        {genres.map((summary) => (
          <GenreTile
            key={summary.genre.slug}
            summary={summary}
            isSelected={summary.genre.slug === selectedGenreSlug}
            onSelect={onSelectGenre}
          />
        ))}
      </div>
    </section>
  );
}

interface GenreTileProps {
  summary: GenreSummary;
  isSelected: boolean;
  onSelect: (genreSlug: string) => void;
}

function GenreTile({ summary, isSelected, onSelect }: Readonly<GenreTileProps>) {
  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={() => onSelect(summary.genre.slug)}
      className="toggle-button--tile group snap-start items-center"
    >
      <div className="relative aspect-16/10 w-full">
        {COVER_SLOTS.map((slot, index) => (
          <div
            key={slot.id}
            className={`absolute top-0 h-full w-[48%] overflow-hidden bg-background transition-transform duration-350 ease-snap ${slot.className}`}
          >
            <GameCoverImage
              game={summary.covers[index]}
              sizes="(max-width: 760px) 36vw, (max-width: 1000px) 16vw, 12vw"
              isDecorative
            />
          </div>
        ))}
      </div>
      <b className="font-wide text-sm tracking-[-.01em] uppercase group-data-[selected=true]:text-accent">
        {summary.genre.name}
      </b>
      <span className="type-tiny text-muted">{GAMES_COPY.catalog.gameCount(summary.gameCount)}</span>
    </ToggleButton>
  );
}
