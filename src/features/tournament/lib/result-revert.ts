import { findNextMatch } from "@features/tournament/lib/bracket-layout";
import { getSlotFrom } from "@features/tournament/lib/match-resolution";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import type { Match, Tournament } from "@features/tournament/lib/types";

/** Takes the winner of `match` out of the next match, and out of the byes that it caused (RF-63). */
export function removeWinnerFromNextMatch(draft: Tournament, match: Match) {
  const next = findNextMatch(draft.matches, match.id);

  if (!next) {
    reopenTournament(draft);

    return;
  }

  requireNotStarted(next);

  const slot = getSlotFrom(next, match.id);

  slot.playerId = null;
  slot.resolved = false;

  if (isSettledOnItsOwn(next)) {
    removeWinnerFromNextMatch(draft, next);
    reopenMatch(next);
  } else {
    next.status = "pending";
  }
}

// A match that already started or was decided by a person cannot be undone from behind.
function requireNotStarted(next: Match) {
  const isStarted = next.status === "active" || next.status === "frozen";
  const isDecided = next.status === "finished" && !isSettledOnItsOwn(next);

  if (isStarted || isDecided) {
    throw new TournamentRuleError(TOURNAMENT_COPY.errors.nextMatchStarted(next.number));
  }
}

function isSettledOnItsOwn(match: Match): boolean {
  return match.status === "finished" && (match.outcome === "bye" || match.outcome === "empty");
}

function reopenMatch(match: Match) {
  match.status = "pending";
  match.winnerSlot = null;
  match.outcome = null;
  match.finishedAt = null;
}

function reopenTournament(draft: Tournament) {
  draft.phase = "running";
  draft.championId = null;
}
