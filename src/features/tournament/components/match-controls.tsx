import { CommandButton, type TournamentAction } from "@features/tournament/components/command-button";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { PlayerView } from "@features/tournament/lib/tournament-view";
import type { Match } from "@features/tournament/lib/types";

export interface MatchPermissions {
  /** The viewer may start the match, mark the loser and mark an absence (its desk, or the administrator). */
  canCapture: boolean;
  isAdmin: boolean;
}

interface MatchControlsProps {
  match: Match;
  players: readonly [PlayerView, PlayerView];
  permissions: MatchPermissions;
  action: TournamentAction;
  onApplied: () => void;
}

type ControlsProps = Omit<MatchControlsProps, "permissions">;

const COPY = TOURNAMENT_COPY.ui;

export function MatchControls({ match, players, permissions, action, onApplied }: Readonly<MatchControlsProps>) {
  const shared = { match, players, action, onApplied };

  if (match.status === "frozen") {
    return permissions.isAdmin ? (
      <FrozenControls {...shared} />
    ) : (
      <p className="text-sm text-muted">{COPY.match.frozenNotice}</p>
    );
  }

  return (
    <div className="grid gap-3">
      {permissions.canCapture && <CaptureControls {...shared} />}
      {permissions.isAdmin && <AdminControls {...shared} />}
    </div>
  );
}

function CaptureControls({ match, players, action, onApplied }: Readonly<ControlsProps>) {
  const base = { action, onApplied };

  if (match.status === "ready") {
    return (
      <div className="grid gap-2">
        <CommandButton
          {...base}
          label={COPY.actions.start}
          variant="primary"
          command={{ type: "start_match", matchId: match.id }}
        />
        <AbsenceButtons match={match} players={players} {...base} />
      </div>
    );
  }

  if (match.status !== "active") return null;

  return (
    <div className="grid gap-2">
      {players.map((player) => (
        <CommandButton
          key={player.slot}
          {...base}
          needsConfirmation
          label={COPY.actions.loses(player.tag)}
          command={{ type: "finish_match", matchId: match.id, slots: [player.slot] }}
        />
      ))}
      <AbsenceButtons match={match} players={players} {...base} />
    </div>
  );
}

function AbsenceButtons({ match, players, action, onApplied }: Readonly<ControlsProps>) {
  return players.map((player) => (
    <CommandButton
      key={player.slot}
      action={action}
      onApplied={onApplied}
      needsConfirmation
      variant="tertiary"
      label={COPY.actions.noShow(player.tag)}
      command={{ type: "mark_no_show", matchId: match.id, slots: [player.slot] }}
    />
  ));
}

function AdminControls({ match, action, onApplied }: Readonly<ControlsProps>) {
  const base = { action, onApplied };

  if (match.status === "ready" || match.status === "active") {
    return (
      <CommandButton
        {...base}
        variant="tertiary"
        label={COPY.actions.freeze}
        command={{ type: "freeze_match", matchId: match.id }}
      />
    );
  }

  if (match.status === "finished" && (match.outcome === "no_show" || match.outcome === "disqualified")) {
    return (
      <CommandButton
        {...base}
        needsConfirmation
        variant="danger"
        label={COPY.actions.revert}
        command={{ type: "revert_result", matchId: match.id }}
      />
    );
  }

  return null;
}

function FrozenControls({ match, players, action, onApplied }: Readonly<ControlsProps>) {
  const base = { action, onApplied, needsConfirmation: true, variant: "danger" } as const;

  return (
    <div className="grid gap-2">
      <CommandButton
        action={action}
        onApplied={onApplied}
        label={COPY.actions.unfreeze}
        command={{ type: "unfreeze_match", matchId: match.id }}
      />
      {players.map((player) => (
        <CommandButton
          key={player.slot}
          {...base}
          label={COPY.actions.disqualify(player.tag)}
          command={{ type: "disqualify", matchId: match.id, slots: [player.slot] }}
        />
      ))}
      <CommandButton
        {...base}
        label={COPY.actions.disqualifyBoth}
        command={{ type: "disqualify", matchId: match.id, slots: [0, 1] }}
      />
    </div>
  );
}
