import type { MatchArea, MatchOutcome, MatchStatus } from "@features/tournament/lib/types";

const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: "Pendiente",
  ready: "Listo",
  active: "En juego",
  finished: "Terminado",
  frozen: "Congelado",
};

const AREA_LABELS: Record<MatchArea, string> = {
  board_1: "Tablero 1",
  board_2: "Tablero 2",
  board_3: "Tablero 3",
  board_4: "Tablero 4",
  semifinal_1: "Semifinal 1",
  semifinal_2: "Semifinal 2",
  final: "Final",
};

const OUTCOME_LABELS: Record<MatchOutcome, string> = {
  played: "Jugado",
  no_show: "No se presentó",
  disqualified: "Descalificación",
  bye: "Bye",
  empty: "Sin jugadores",
};

export const TOURNAMENT_COPY = {
  bye: "BYE",
  tbd: "Por definir",
  status: STATUS_LABELS,
  areas: AREA_LABELS,
  outcomes: OUTCOME_LABELS,
  ui: {
    title: "Torneo de KOF",
    description: "Captura y seguimiento del bracket del torneo de KOF.",
    loading: "Cargando el torneo...",
    signedInAs: (name: string, role: string) => `Sesión de ${name} · ${role}`,
    roles: {
      kof_admin: "Administrador de KOF",
      kof_staff: (desk: number | null) => (desk === null ? "Staff de KOF" : `Staff de KOF · Mesa ${desk}`),
    },
    notGenerated: "El bracket todavía no se genera. Se genera a la hora configurada del evento.",
    noDesk: "Tu cuenta todavía no tiene una mesa asignada. Pide al administrador de KOF que te la asigne.",
    connectionLost: "Sin conexión. Se muestra el último estado recibido.",
    summaryLabel: "Resumen",
    summary: { ready: "Listos", active: "En juego", frozen: "Congelados", finished: "Terminados" },
    champion: (tag: string) => `Campeón: ${tag}`,
    noChampion: "El torneo terminó sin campeón.",
    match: {
      heading: (number: number) => `Combate #${number}`,
      round: (round: number) => `Ronda ${round}`,
      winner: "Ganó",
      frozenNotice: "Congelado: solo el administrador de KOF lo resuelve.",
    },
    actions: {
      start: "Iniciar combate",
      loses: (tag: string) => `Pierde ${tag}`,
      noShow: (tag: string) => `No se presentó: ${tag}`,
      freeze: "Congelar",
      unfreeze: "Descongelar",
      disqualify: (tag: string) => `Descalificar a ${tag}`,
      disqualifyBoth: "Descalificar a los dos",
      revert: "Revertir resultado",
      confirm: "Confirmar",
      cancel: "Cancelar",
      confirmQuestion: "¿Seguro? Esta acción queda en la bitácora.",
      sending: "Enviando...",
    },
    log: { heading: "Bitácora", empty: "Todavía no hay movimientos." },
  },
  errors: {
    matchNotFound: "No se encontró el combate.",
    wrongStatus: (status: string) => `El combate está en estado "${status}" y no admite esta operación.`,
    invalidSlots: "Indica uno o los dos jugadores, sin repetirlos.",
    notRevertible: "Solo se revierte un resultado por No se presentó o descalificación.",
    nextMatchStarted: (number: number) => `No se puede revertir: el combate #${number} ya empezó o terminó.`,
    forbidden: "No puedes capturar este combate.",
    invalidCommand: "La operación no es válida.",
    notGenerated: "El bracket todavía no se genera.",
    conflict: "No se pudo guardar el cambio, intenta de nuevo.",
    matchChanged: "El combate cambió, recarga.",
    damagedState: "El estado guardado del torneo está dañado.",
    missingSettings: "Faltan los horarios del evento para generar el bracket.",
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
