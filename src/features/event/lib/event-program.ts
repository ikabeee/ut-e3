import type {
  EventActivity,
  EventHero,
  EventIntro,
  ScheduleEntry,
  ScheduleHighlights,
  ScheduleMilestone,
} from "@features/event/lib/types";
import { siteConfig } from "@shared/lib/site-config";

const { division, universityShortName } = siteConfig.organization;

/**
 * Contenido editable de la portada: presentación, programa del día y actividades.
 * Los horarios sólo se escriben en `EVENT_SCHEDULE`; las tarjetas de torneos y sorteos, el
 * detalle de cada juego y el croquis los toman de ahí (`getScheduleHighlights`).
 * Los `zoneId` del programa deben existir en `floor-plan/lib/plan-places.ts`.
 */
export const EVENT_INTRO: EventIntro = {
  title: ["Juegos hechos", `en la ${universityShortName}`],
  lead: `Los equipos de la ${division} presentan los videojuegos que desarrollaron. Cada equipo tiene un stand con su juego listo para jugar.`,
  details:
    "Recorre los stands, prueba las demos y platica con quienes los hicieron. Durante el día hay torneos y sorteos. La entrada es libre.",
};

export const EVENT_HERO: EventHero = {
  title: "Showcase de videojuegos",
  summary: "Pruébalos, compite en los torneos y participa en los sorteos.",
  callToAction: "Quiero participar",
  reelLabel: "Reel 2026",
};

/** Descripción del encabezado con el número real de juegos del catálogo. */
export function describeShowcase(gameCount: number) {
  return `${gameCount} juegos creados por la ${division}. ${EVENT_HERO.summary}`;
}

/** Programa del día. `milestone` marca los horarios que citan otros textos. */
export const EVENT_SCHEDULE: readonly ScheduleEntry[] = [
  { time: "10:00", title: "Apertura", zoneId: "entry" },
  { time: "10:30", title: "Presentación de los equipos", zoneId: "stage" },
  { time: "12:00", title: "Cierre de inscripciones a torneos", zoneId: "arena", milestone: "tournamentSignupDeadline" },
  { time: "13:00", title: "Primer sorteo", zoneId: "stage", milestone: "raffle" },
  { time: "13:30", title: "Rondas de torneos", zoneId: "arena", milestone: "tournamentRounds" },
  { time: "16:00", title: "Segundo sorteo", zoneId: "stage", milestone: "raffle" },
  { time: "17:00", title: "Finales de torneos", zoneId: "stage", milestone: "tournamentFinals" },
  { time: "19:00", title: "Sorteo final y premiación", zoneId: "stage", milestone: "raffle" },
  { time: "20:00", title: "Cierre", zoneId: "entry" },
];

/**
 * Horarios que citan otros textos, tomados del programa. Si falta un hito, lanza un error:
 * el build se detiene en lugar de publicar un texto sin hora.
 */
export function getScheduleHighlights(schedule: readonly ScheduleEntry[]): ScheduleHighlights {
  const timeOf = (milestone: Exclude<ScheduleMilestone, "raffle">) => {
    const entry = schedule.find((candidate) => candidate.milestone === milestone);
    if (!entry) {
      throw new Error(`El programa no marca el horario "${milestone}" (EVENT_SCHEDULE en event-program.ts).`);
    }
    return entry.time;
  };

  return {
    tournamentSignupDeadline: timeOf("tournamentSignupDeadline"),
    tournamentRoundsAt: timeOf("tournamentRounds"),
    tournamentFinalsAt: timeOf("tournamentFinals"),
    raffleTimes: schedule.filter((entry) => entry.milestone === "raffle").map((entry) => entry.time),
  };
}

/** Nombre de cada sorteo en su tarjeta: el último siempre es "Final". */
const RAFFLE_ORDINALS = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto"];

function getRaffleLabel(index: number, count: number) {
  return index === count - 1 ? "Final" : RAFFLE_ORDINALS[index];
}

/** Tarjetas de torneos y sorteos de la portada, con los horarios del programa. */
export function buildEventActivities({
  tournamentSignupDeadline,
  tournamentRoundsAt,
  tournamentFinalsAt,
  raffleTimes,
}: ScheduleHighlights): EventActivity[] {
  return [
    {
      id: "tournaments",
      place: "Arena de torneos",
      title: "Torneos",
      description: `Compite en los juegos de los equipos. Inscríbete en la Arena antes de las ${tournamentSignupDeadline}. Las finales se juegan en el main stage.`,
      facts: [
        { label: "Inscripción", value: `Hasta ${tournamentSignupDeadline}` },
        { label: "Rondas", value: tournamentRoundsAt },
        { label: "Finales", value: tournamentFinalsAt },
      ],
    },
    {
      id: "raffles",
      place: "Main stage",
      title: "Sorteos",
      description:
        "Pide tu boleto en el módulo de Información. Los sorteos se hacen durante el día y debes estar presente para recoger tu premio.",
      facts: raffleTimes.map((time, index) => ({ label: getRaffleLabel(index, raffleTimes.length), value: time })),
    },
  ];
}
