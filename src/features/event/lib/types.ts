/** Dato corto de una actividad (por ejemplo "Inscripción · Hasta 12:00"). */
export interface ActivityFact {
  label: string;
  value: string;
}

/** Actividad del día con sus horarios (torneos y sorteos). */
export interface EventActivity {
  id: string;
  /** Lugar donde ocurre, como antetítulo. */
  place: string;
  title: string;
  description: string;
  facts: readonly ActivityFact[];
}

/** Renglón del programa; `zoneId` es la zona del croquis donde ocurre. */
export interface ScheduleEntry {
  time: string;
  title: string;
  zoneId: string;
}
