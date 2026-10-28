import { findNextMatch } from "@features/tournament/lib/bracket-layout";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import type { Match, MatchOutcome, MatchSlot, SlotIndex, Tournament } from "@features/tournament/lib/types";

const LOG = TOURNAMENT_COPY.log;

const MAX_LOG_ENTRIES = 60;

export interface Resolution {
  /** `null` when nobody wins: both players were removed or the match had nobody. */
  winnerSlot: SlotIndex | null;
  outcome: MatchOutcome;
  at: number;
}

/** Closes the match, moves its winner to the next one and ends the tournament after the final (RF-61, RF-65). */
export function resolveMatch(draft: Tournament, match: Match, resolution: Resolution) {
  match.status = "finished";
  match.statusBeforeFreeze = null;
  match.winnerSlot = resolution.winnerSlot;
  match.outcome = resolution.outcome;
  match.finishedAt = resolution.at;

  if (resolution.outcome === "played") {
    addLog(draft, resolution.at, LOG.finished(match.number, getPlayerTag(draft, getWinnerId(match))));
  }

  advanceWinner(draft, match, resolution.at);
}

/** Once both slots are known the match is ready, or it settles on its own when a bye or nobody is in it (RF-60). */
export function settleMatch(draft: Tournament, match: Match, now: number) {
  const [first, second] = match.slots;

  if (!first.resolved || !second.resolved) return;

  if (first.playerId !== null && second.playerId !== null) {
    match.status = "ready";

    return;
  }

  const outcome = first.playerId === null && second.playerId === null ? "empty" : "bye";

  resolveMatch(draft, match, { winnerSlot: getSurvivorSlot(first, second), outcome, at: now });
}

export function addLog(draft: Tournament, now: number, message: string) {
  draft.log = [{ at: now, message }, ...draft.log].slice(0, MAX_LOG_ENTRIES);
}

export function getPlayerTag(tournament: Tournament, playerId: string | null): string {
  if (playerId === null) return TOURNAMENT_COPY.bye;

  return tournament.players.find((player) => player.id === playerId)?.tag ?? TOURNAMENT_COPY.tbd;
}

export function findMatch(draft: Tournament, matchId: string): Match {
  const match = draft.matches.find((item) => item.id === matchId);

  if (!match) throw new TournamentRuleError(TOURNAMENT_COPY.errors.matchNotFound);

  return match;
}

function getWinnerId(match: Match): string | null {
  return match.winnerSlot === null ? null : match.slots[match.winnerSlot].playerId;
}

function getSurvivorSlot(first: MatchSlot, second: MatchSlot): SlotIndex | null {
  if (first.playerId !== null) return 0;

  return second.playerId !== null ? 1 : null;
}

function advanceWinner(draft: Tournament, match: Match, now: number) {
  const next = findNextMatch(draft.matches, match.id);
  const winnerId = getWinnerId(match);

  if (!next) {
    finishTournament(draft, winnerId, now);

    return;
  }

  const slot = getSlotFrom(next, match.id);

  slot.playerId = winnerId;
  slot.resolved = true;
  settleMatch(draft, next, now);
}

function finishTournament(draft: Tournament, championId: string | null, now: number) {
  draft.phase = "finished";
  draft.championId = championId;
  addLog(draft, now, championId ? LOG.champion(getPlayerTag(draft, championId)) : LOG.noChampion);
}

/** The slot of `match` that is fed by the winner of `feederId`. */
export function getSlotFrom(match: Match, feederId: string): MatchSlot {
  const slot = match.slots.find((item) => item.source.kind === "winner" && item.source.matchId === feederId);

  if (!slot) throw new Error(`Match ${match.id} is not fed by ${feederId}`);

  return slot;
}
