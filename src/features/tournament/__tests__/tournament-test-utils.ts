import { generateBracket } from "@features/tournament/lib/bracket-generation";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import type { Match, Player, SlotIndex, Tournament } from "@features/tournament/lib/types";

// 12:55 in Cancun on the day of the event.
export const NOW = Date.UTC(2026, 10, 20, 17, 55);

export function createTestTournament(playerCount = 64, seed = 7): Tournament {
  return generateBracket(createPlayers(playerCount), createSeededRandomInt(seed), NOW);
}

// Plays the matches in the given order; the player in slot 0 always wins.
export function playMatches(tournament: Tournament, numbers: readonly number[]): Tournament {
  return numbers.reduce((current, number) => startAndFinish(current, number), tournament);
}

export function playUntilFinished(tournament: Tournament): Tournament {
  const next = tournament.matches.find((match) => match.status === "ready");

  return next ? playUntilFinished(startAndFinish(tournament, next.number)) : tournament;
}

export function freezeAndDisqualify(tournament: Tournament, number: number, slots: SlotIndex[]): Tournament {
  const matchId = getMatch(tournament, number).id;
  const frozen = applyCommand(tournament, { type: "freeze_match", matchId }, NOW);

  return applyCommand(frozen, { type: "disqualify", matchId, slots }, NOW);
}

export function startAndFinish(tournament: Tournament, number: number, loserSlot: SlotIndex = 1): Tournament {
  const matchId = getMatch(tournament, number).id;
  const started = applyCommand(tournament, { type: "start_match", matchId }, NOW);

  return applyCommand(started, { type: "finish_match", matchId, loserSlot }, NOW);
}

export function getMatch(tournament: Tournament, number: number): Match {
  const match = tournament.matches.find((item) => item.number === number);

  if (!match) throw new Error(`Match ${number} does not exist`);

  return match;
}

export function createPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => ({ id: `player-${index + 1}`, tag: `Tag${index + 1}` }));
}

// mulberry32: a small seeded generator so the shuffle is reproducible.
export function createSeededRandomInt(seed: number) {
  let state = seed;

  return (maxExclusive: number) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);

    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return Math.floor((((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296) * maxExclusive);
  };
}

export function range(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}
