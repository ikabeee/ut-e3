import Link from "next/link";
import type { Game } from "../domain/game";
import { GenreBadge } from "./genre-badge";

export function GameDetail({ game }: { game: Game }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <GenreBadge genre={game.genre} />
        <h1 className="text-4xl font-bold tracking-tight">{game.title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Desarrollado por{" "}
          <Link href={`/teams#${game.team.slug}`} className="font-medium underline">
            {game.team.name}
          </Link>
          {game.engine && <> · {game.engine}</>}
          {game.standNumber !== null && <> · Stand {game.standNumber}</>}
        </p>
      </header>

      <p className="max-w-2xl text-lg leading-8">{game.description}</p>

      <div className="flex flex-wrap gap-3">
        {game.playUrl && (
          <a
            href={game.playUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-5 py-2 text-background"
          >
            Jugar
          </a>
        )}
        {game.repoUrl && (
          <a
            href={game.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black/10 px-5 py-2 dark:border-white/20"
          >
            Ver código
          </a>
        )}
      </div>
    </article>
  );
}
