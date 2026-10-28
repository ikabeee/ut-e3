import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { PublicMatch } from "@features/tournament/lib/public-bracket";

const COPY = TOURNAMENT_COPY.ui;

/** One match as any visitor sees it: who plays, the status and, when it ended, who won. */
export function PublicMatchCard({ match }: Readonly<{ match: PublicMatch }>) {
  return (
    <li className="grid content-start gap-3 border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="type-mono font-bold">{COPY.match.heading(match.number)}</h4>
        <span className="type-tiny text-muted">{COPY.publicBracket.statuses[match.status]}</span>
      </div>
      <ul className="m-0 grid list-none gap-1 p-0">
        {match.players.map((player, index) => (
          <li key={index} className="flex min-h-8 items-center justify-between gap-2">
            <span className={player.isBye ? "text-muted" : "font-bold"}>{player.tag}</span>
            {player.isWinner && <span className="type-tiny text-accent">{COPY.match.winner}</span>}
          </li>
        ))}
      </ul>
      {match.status === "finished" && match.outcome && (
        <p className="type-tiny text-muted">{TOURNAMENT_COPY.outcomes[match.outcome]}</p>
      )}
    </li>
  );
}
