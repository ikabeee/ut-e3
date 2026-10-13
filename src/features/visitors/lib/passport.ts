import type { VisitorPassport } from "@features/visitors/lib/types";

/**
 * En qué punto del sorteo va el visitante:
 * - `locked`: le faltan juegos por probar.
 * - `claim`: ya probó todos; puede dejar su teléfono para obtener el boleto.
 * - `ticket`: ya tiene boleto.
 */
export type RaffleStage = "locked" | "claim" | "ticket";

export function getRaffleStage(passport: VisitorPassport): RaffleStage {
  if (passport.ticket) return "ticket";
  const isComplete = passport.requiredCount > 0 && passport.checkedCount >= passport.requiredCount;

  return isComplete ? "claim" : "locked";
}

export function countMissingGames(passport: VisitorPassport) {
  return Math.max(passport.requiredCount - passport.checkedCount, 0);
}

/** Número del boleto con ceros a la izquierda, como en un boleto impreso: 7 -> "0007". */
export function formatTicketNumber(ticketNumber: number) {
  return String(ticketNumber).padStart(4, "0");
}
