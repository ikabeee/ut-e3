import { addLog, findMatch, getPlayerTag, resolveMatch } from "@features/tournament/lib/match-resolution";
import { removeWinnerFromNextMatch } from "@features/tournament/lib/result-revert";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import type {
  Match,
  MatchOutcome,
  MatchStatus,
  SlotIndex,
  Tournament,
  TournamentCommand,
} from "@features/tournament/lib/types";

const ERRORS = TOURNAMENT_COPY.errors;

const LOG = TOURNAMENT_COPY.log;

const SLOT_INDEXES: readonly SlotIndex[] = [0, 1];

/**
 * Applies one command and returns the new tournament; the one it receives is not changed. It only checks the rules of
 * the match: who may send each command is decided by the Server Action (RF-62).
 */
export function applyCommand(tournament: Tournament, command: TournamentCommand, now: number): Tournament {
  const draft = cloneTournament(tournament);

  runCommand(draft, command, now);
  draft.version += 1;

  return draft;
}

function cloneTournament(tournament: Tournament): Tournament {
  // SAFETY: `Tournament` only holds plain JSON (no dates, functions or undefined), so the copy has the same shape.
  return JSON.parse(JSON.stringify(tournament)) as Tournament;
}

function runCommand(draft: Tournament, command: TournamentCommand, now: number) {
  switch (command.type) {
    case "start_match":
      return startMatch(draft, command.matchId, now);
    case "finish_match":
      return finishMatch(draft, command, now);
    case "mark_no_show":
      return removePlayers(draft, command, now);
    case "freeze_match":
      return freezeMatch(draft, command.matchId, now);
    case "unfreeze_match":
      return unfreezeMatch(draft, command.matchId, now);
    case "disqualify":
      return removePlayers(draft, command, now);
    case "revert_result":
      return revertResult(draft, command.matchId, now);
  }
}

function startMatch(draft: Tournament, matchId: string, now: number) {
  const match = findMatch(draft, matchId);

  requireStatus(match, ["ready"]);
  match.status = "active";
  match.startedAt = now;
  addLog(draft, now, LOG.started(match.number));
}

function finishMatch(draft: Tournament, command: Extract<TournamentCommand, { type: "finish_match" }>, now: number) {
  const match = findMatch(draft, command.matchId);

  requireStatus(match, ["active"]);
  resolveMatch(draft, match, { winnerSlot: command.loserSlot === 0 ? 1 : 0, outcome: "played", at: now });
}

// "No se presentó" (staff) and a disqualification (administrator, frozen match) have the same effect (RF-63, RF-64).
function removePlayers(
  draft: Tournament,
  command: Extract<TournamentCommand, { type: "mark_no_show" | "disqualify" }>,
  now: number,
) {
  const outcome: MatchOutcome = command.type === "disqualify" ? "disqualified" : "no_show";
  const match = findMatch(draft, command.matchId);

  requireStatus(match, command.type === "disqualify" ? ["frozen"] : ["ready", "active"]);
  requireSlots(command.slots);

  const survivors = SLOT_INDEXES.filter((slot) => !command.slots.includes(slot));
  const removed = command.slots.map((slot) => getPlayerTag(draft, match.slots[slot].playerId)).join(", ");
  const message = outcome === "no_show" ? LOG.noShow(match.number, removed) : LOG.disqualified(match.number, removed);

  addLog(draft, now, message);
  resolveMatch(draft, match, { winnerSlot: survivors.at(0) ?? null, outcome, at: now });
}

function freezeMatch(draft: Tournament, matchId: string, now: number) {
  const match = findMatch(draft, matchId);

  requireStatus(match, ["ready", "active"]);
  match.statusBeforeFreeze = match.status === "active" ? "active" : "ready";
  match.status = "frozen";
  addLog(draft, now, LOG.frozen(match.number));
}

function unfreezeMatch(draft: Tournament, matchId: string, now: number) {
  const match = findMatch(draft, matchId);

  requireStatus(match, ["frozen"]);
  match.status = match.statusBeforeFreeze ?? "ready";
  match.statusBeforeFreeze = null;
  addLog(draft, now, LOG.unfrozen(match.number));
}

// The match goes back to active and its player leaves the next match, if that one has not started (RF-63).
function revertResult(draft: Tournament, matchId: string, now: number) {
  const match = findMatch(draft, matchId);

  requireStatus(match, ["finished"]);

  if (match.outcome !== "no_show" && match.outcome !== "disqualified") {
    throw new TournamentRuleError(ERRORS.notRevertible);
  }

  removeWinnerFromNextMatch(draft, match);
  match.status = "active";
  match.winnerSlot = null;
  match.outcome = null;
  match.finishedAt = null;
  addLog(draft, now, LOG.reverted(match.number));
}

function requireStatus(match: Match, allowed: readonly MatchStatus[]) {
  if (!allowed.includes(match.status)) {
    throw new TournamentRuleError(ERRORS.wrongStatus(TOURNAMENT_COPY.status[match.status]));
  }
}

function requireSlots(slots: readonly SlotIndex[]) {
  const isValid = slots.length >= 1 && slots.length <= 2 && new Set(slots).size === slots.length;

  if (!isValid) throw new TournamentRuleError(ERRORS.invalidSlots);
}
