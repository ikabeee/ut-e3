import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { TournamentLogEntry } from "@features/tournament/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

const COPY = TOURNAMENT_COPY.ui.log;

const VISIBLE_ENTRIES = 20;

export function TournamentLog({ entries }: Readonly<{ entries: readonly TournamentLogEntry[] }>) {
  return (
    <section aria-labelledby="tournament-log-heading" className="grid gap-4">
      <h2 id="tournament-log-heading" className="type-section">
        {COPY.heading}
      </h2>
      {entries.length === 0 ? (
        <p className="type-mono text-muted">{COPY.empty}</p>
      ) : (
        <ol className="m-0 grid list-none gap-2 p-0">
          {entries.slice(0, VISIBLE_ENTRIES).map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="grid grid-cols-[64px_1fr] gap-x-3 text-sm">
              <time
                dateTime={new Date(entry.at).toISOString()}
                className="font-mono font-bold text-accent tabular-nums"
              >
                {formatTimeOfDay(new Date(entry.at).toISOString())}
              </time>
              <span>{entry.message}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
