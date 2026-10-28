import type { TournamentAction } from "@features/tournament/components/command-button";
import { MatchControls, type MatchPermissions } from "@features/tournament/components/match-controls";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { PlayerView } from "@features/tournament/lib/tournament-view";
import type { Match } from "@features/tournament/lib/types";

interface MatchCardProps {
  match: Match;
  players: readonly [PlayerView, PlayerView];
  permissions: MatchPermissions;
  action: TournamentAction;
  onApplied: () => void;
}

const COPY = TOURNAMENT_COPY.ui.match;

export function MatchCard({ match, players, permissions, action, onApplied }: Readonly<MatchCardProps>) {
  return (
    <li className="grid content-start gap-3 border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="type-mono font-bold">{COPY.heading(match.number)}</h4>
        <span className="type-tiny text-muted">{TOURNAMENT_COPY.status[match.status]}</span>
      </div>
      <ul className="m-0 grid list-none gap-1 p-0">
        {players.map((player) => (
          <PlayerRow key={player.slot} player={player} />
        ))}
      </ul>
      {match.status === "finished" && match.outcome && (
        <p className="type-tiny text-muted">{TOURNAMENT_COPY.outcomes[match.outcome]}</p>
      )}
      <MatchControls match={match} players={players} permissions={permissions} action={action} onApplied={onApplied} />
    </li>
  );
}

function PlayerRow({ player }: Readonly<{ player: PlayerView }>) {
  return (
    <li className="flex min-h-8 items-center justify-between gap-2">
      <span className={player.isBye ? "text-muted" : "font-bold"}>{player.tag}</span>
      {player.isWinner && <span className="type-tiny text-accent">{COPY.winner}</span>}
    </li>
  );
}
