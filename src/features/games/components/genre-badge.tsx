import { GAME_GENRE_LABELS } from "../lib/genres";
import type { GameGenre } from "../lib/types";

export function GenreBadge({ genre }: { genre: GameGenre }) {
  return (
    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
      {GAME_GENRE_LABELS[genre]}
    </span>
  );
}
