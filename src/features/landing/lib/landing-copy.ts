/**
 * Textos de la landing por sección. La fecha, la sede, la entrada y los horarios no se escriben aquí:
 * salen de `EVENT_INFO`, `EVENT_VENUE` y `EVENT_SCHEDULE` (feature `event`).
 */
export const LANDING_COPY = {
  hero: {
    kicker: "Showcase",
    title: "Videojuegos",
    viewGames: "Ver juegos",
    addToCalendar: "Agendar fecha",
  },
  groups: {
    // Los grupos (`StudentGroup`) llegan por datos; aquí sólo van sus etiquetas.
    ariaLabel: "Grupos participantes",
  },
  intro: {
    title: "Juegos que surgen de la UT Cancún",
    lead: (division: string) => `Los equipos de la ${division} presentan los videojuegos que desarrollaron`,
    tagline: ["Recorre los stands", "Prueba las demos", "Platica con los desarrolladores"],
  },
  games: {
    teamCount: (count: number) => `Hay un total de ${count} equipos. Cada equipo desarrolló un videojuego.`,
  },
  dynamics: {
    title: "Torneos y dinámicas",
    subtitle: "Participa y gana premios",
  },
  program: {
    title: "Programa del evento",
    subtitle: "¡No te quedes con las ganas!",
    scheduleHeading: "Horario",
    countdownLabel: "Tiempo faltante para el evento",
    units: { days: "Días", hours: "Horas", minutes: "Minutos", seconds: "Segundos" },
  },
} as const;
