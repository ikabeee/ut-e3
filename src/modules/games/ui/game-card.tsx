import Link from "next/link";
import type { Game } from "../domain/game";
import { GenreBadge } from "./genre-badge";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
    >
      <div className="flex items-center justify-between gap-2">
        <GenreBadge genre={game.genre} />
        {game.standNumber !== null && (
          <span className="text-xs text-zinc-500">Stand {game.standNumber}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold">{game.title}</h3>
      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
        {game.description}
      </p>
      <p className="mt-auto text-xs text-zinc-500">por {game.team.name}</p>
    </Link>
  );
}
