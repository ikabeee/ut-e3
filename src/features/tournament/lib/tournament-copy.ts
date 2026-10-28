import type { MatchStatus } from "@features/tournament/lib/types";

const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: "Pendiente",
  ready: "Listo",
  active: "En juego",
  finished: "Terminado",
  frozen: "Congelado",
};

export const TOURNAMENT_COPY = {
  bye: "BYE",
  tbd: "Por definir",
  status: STATUS_LABELS,
  errors: {
    matchNotFound: "No se encontró el combate.",
    wrongStatus: (status: string) => `El combate está en estado "${status}" y no admite esta operación.`,
    invalidSlots: "Indica uno o los dos jugadores, sin repetirlos.",
    notRevertible: "Solo se revierte un resultado por No se presentó o descalificación.",
    nextMatchStarted: (number: number) => `No se puede revertir: el combate #${number} ya empezó o terminó.`,
    invalidEntrantCount: (minimum: number, maximum: number) =>
      `El bracket necesita entre ${minimum} y ${maximum} jugadores con check-in.`,
  },
  log: {
    bracketGenerated: (players: number, byes: number) => `Bracket generado con ${players} jugadores y ${byes} byes.`,
    started: (number: number) => `Combate #${number} en juego.`,
    finished: (number: number, winner: string) => `Combate #${number}: gana ${winner}.`,
    noShow: (number: number, absent: string) => `Combate #${number}: no se presentó ${absent}.`,
    disqualified: (number: number, removed: string) => `Combate #${number}: descalificado ${removed}.`,
    frozen: (number: number) => `Combate #${number} congelado.`,
    unfrozen: (number: number) => `Combate #${number} descongelado.`,
    reverted: (number: number) => `Combate #${number}: resultado revertido.`,
    champion: (winner: string) => `Campeón: ${winner}.`,
    noChampion: "El torneo terminó sin campeón.",
  },
} as const;
