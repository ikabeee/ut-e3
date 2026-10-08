import type { Team } from "../lib/types";

export function TeamCard({ team }: { team: Team }) {
  return (
    <article
      id={team.slug}
      className="flex flex-col gap-2 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{team.name}</h3>
        {team.group && <span className="text-xs text-zinc-500">{team.group}</span>}
      </header>
      <ul className="text-sm text-zinc-600 dark:text-zinc-400">
        {team.members.map((member) => (
          <li key={member}>{member}</li>
        ))}
      </ul>
      <p className="mt-auto text-xs text-zinc-500">
        {team.gameCount} {team.gameCount === 1 ? "videojuego" : "videojuegos"}
      </p>
    </article>
  );
}
