"use client";

import { GAME_GENRE_LABELS } from "../lib/genres";
import type { GameGenre } from "../lib/types";

interface GenreFilterProps {
  genres: GameGenre[];
  selectedGenre: GameGenre | null;
  onSelect: (genre: GameGenre | null) => void;
}

export function GenreFilter({ genres, selectedGenre, onSelect }: GenreFilterProps) {
  const options: Array<{ value: GameGenre | null; label: string }> = [
    { value: null, label: "Todos" },
    ...genres.map((genre) => ({ value: genre, label: GAME_GENRE_LABELS[genre] })),
  ];

  return (
    <div role="group" aria-label="Filtrar por género" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.value === selectedGenre;
        return (
          <button
            key={option.value ?? "all"}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(option.value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-black/10 hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
