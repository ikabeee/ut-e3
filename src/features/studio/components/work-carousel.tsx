"use client";

import { ToggleButton } from "@heroui/react";
import type { Game, Genre } from "@features/games/lib/types";
import { WorkCard } from "@features/studio/components/work-card";
import { useScrollPages } from "@features/studio/hooks/use-scroll-pages";
import { useWorkFilter } from "@features/studio/hooks/use-work-filter";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { ArrowButton } from "@shared/components/arrow-button";

const { work } = STUDIO_COPY;

const FILTER_CLASSES =
  "min-h-11 min-w-0 rounded-none border border-black bg-transparent px-3 py-2 type-tiny text-black hover:bg-black hover:text-paper active:transform-none data-[selected=true]:bg-black data-[selected=true]:text-accent";

// Dark arrows on the light panel: transparent base, black edge and ink.
const PAGER_ARROW_CLASSES = "h-11 [--btn-base:transparent] [--btn-edge:var(--utg-black)] [--btn-ink:var(--utg-black)]";

/** The games of the showcase, filtered by genre in the browser. */
export function WorkCarousel({ games }: Readonly<{ games: Game[] }>) {
  const { genreSlug, genres, visibleGames, selectGenre } = useWorkFilter(games);
  const { ref, pageCount, currentPage, goToPage } = useScrollPages<HTMLUListElement>(genreSlug);

  return (
    <div className="mt-[clamp(28px,4vw,48px)]">
      <GenreFilters genres={genres} selectedSlug={genreSlug} onSelect={selectGenre} />
      <p aria-live="polite" className="mt-4 mb-0 type-tiny opacity-70">
        {work.count(visibleGames.length)}
      </p>
      <ul
        ref={ref}
        aria-label={work.listLabel}
        className="m-0 mt-4 scrollbar-none grid snap-x snap-mandatory list-none auto-cols-[78%] grid-flow-col gap-5 overflow-x-auto p-0 pb-2 sm:auto-cols-[calc((100%-20px)/2)] lg:auto-cols-[calc((100%-2*20px)/3)]"
      >
        {visibleGames.map((game) => (
          <li key={game.id} className="snap-start">
            <WorkCard game={game} />
          </li>
        ))}
      </ul>
      <Pager count={pageCount} current={currentPage} onSelect={goToPage} />
    </div>
  );
}

interface GenreFiltersProps {
  genres: Genre[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

function GenreFilters({ genres, selectedSlug, onSelect }: Readonly<GenreFiltersProps>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span id="work-filter-label" className="type-tiny">
        {work.filterLabel}
      </span>
      <div role="group" aria-labelledby="work-filter-label" className="flex flex-wrap gap-1.5">
        <ToggleButton isSelected={selectedSlug === null} onChange={() => onSelect(null)} className={FILTER_CLASSES}>
          {work.allGenres}
        </ToggleButton>
        {genres.map((genre) => (
          <ToggleButton
            key={genre.slug}
            isSelected={selectedSlug === genre.slug}
            onChange={() => onSelect(genre.slug)}
            className={FILTER_CLASSES}
          >
            {genre.name}
          </ToggleButton>
        ))}
      </div>
    </div>
  );
}

interface PagerProps {
  count: number;
  current: number;
  onSelect: (page: number) => void;
}

/** Previous and next arrows with the page number: fits a phone even when every game is a page. */
function Pager({ count, current, onSelect }: Readonly<PagerProps>) {
  if (count < 2) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <ArrowButton
        direction="previous"
        label={work.previousPage}
        isDisabled={current === 0}
        onPress={() => onSelect(current - 1)}
        className={PAGER_ARROW_CLASSES}
      />
      <p aria-live="polite" aria-label={work.page(current + 1, count)} className="m-0 type-mono tabular-nums">
        {current + 1} / {count}
      </p>
      <ArrowButton
        direction="next"
        label={work.nextPage}
        isDisabled={current === count - 1}
        onPress={() => onSelect(current + 1)}
        className={PAGER_ARROW_CLASSES}
      />
    </div>
  );
}
