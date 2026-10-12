import type { PlanZoneTimes, StandOccupant } from "@features/floor-plan/lib/types";

/**
 * Ocupantes de prueba para las pruebas del croquis. El croquis no conoce los juegos, así que sus
 * pruebas no dependen de los datos de `games`.
 */
export const STAND_OCCUPANT_FIXTURES: readonly StandOccupant[] = [
  { stand: "A1", title: "Ceniza Protocol", subtitle: "Acción", description: "Shooter de supervivencia.", cover: null },
  { stand: "A2", title: "Los Últimos Faros", subtitle: "Aventura", description: "Faros en una costa en ruinas.", cover: null },
  { stand: "A4", title: "Ruta 9", subtitle: "Carreras", description: "Carreras por la carretera.", cover: null },
  { stand: "B1", title: "Xibalbá", subtitle: "Plataformas", description: "Descenso al inframundo maya.", cover: null },
  { stand: "B7", title: "Lucha Pixel", subtitle: "Pelea", description: "Lucha libre en pixel art.", cover: null },
];

/** Horarios de prueba que citan las zonas (en el sitio vienen del programa de `event`). */
export const PLAN_ZONE_TIMES_FIXTURE: PlanZoneTimes = {
  tournamentSignupDeadline: "11:30",
  raffleTimes: ["14:00", "18:00"],
};
