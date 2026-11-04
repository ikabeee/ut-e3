import type { RafflePhase } from "@features/raffle/lib/types";

/** A source of whole numbers in `[0, max)`; the server passes `crypto.randomInt` and the tests a fixed one. */
export type RandomInt = (max: number) => number;

interface RaffleSchedule {
  startsAt: Date;
  closedAt: Date | null;
}

/** Closing wins over the hour: once closed, the raffle stays closed (RF-54). */
export function getRafflePhase({ startsAt, closedAt }: RaffleSchedule, now: Date): RafflePhase {
  if (closedAt) return "closed";

  return now.getTime() < startsAt.getTime() ? "upcoming" : "open";
}

/**
 * Picks one of `count` tickets. Every active ticket is one chance, so a visitor with two tickets has two (RF-22). An
 * index outside the range means a broken generator, and the draw must not go on with it.
 */
export function pickTicketIndex(count: number, randomInt: RandomInt): number {
  const index = randomInt(count);

  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`El generador devolvió ${index} para ${count} boletos.`);
  }

  return index;
}
