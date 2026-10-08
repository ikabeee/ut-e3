import { GAME_GENRE_LABELS, type GameGenre } from "../domain/game";

export function GenreBadge({ genre }: { genre: GameGenre }) {
  return (
    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
      {GAME_GENRE_LABELS[genre]}
    </span>
  );
}
