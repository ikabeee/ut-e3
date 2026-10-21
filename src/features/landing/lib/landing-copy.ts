/**
 * Textos de la landing por sección. La fecha, la sede, la entrada y los horarios no se escriben aquí:
 * salen de `EVENT_INFO`, `EVENT_VENUE` y `EVENT_SCHEDULE` (feature `event`).
 */
export const LANDING_COPY = {
  hero: {
    kicker: "Showcase",
    title: "Videojuegos",
    // El título se parte para intercalar los iconos del diseño: VIDE[+]JUEG[o]S.
    titleParts: ["VIDE", "JUEG", "S"],
    imageAlt: "Manos sosteniendo un control de videojuegos",
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
    bannerAlt: "Ilustración de un control de videojuegos",
    tagline: ["Recorre los stands", "Prueba las demos", "Platica con los desarrolladores"],
  },
  games: {
    teamCount: (count: number) => `Hay un total de ${count} equipos. Cada equipo desarrolló un videojuego.`,
    title: "Videojuegos",
    carouselLabel: "Carrusel de videojuegos",
    previous: "Juego anterior",
    next: "Juego siguiente",
    counter: (current: number, total: number) => `${current}/${total}`,
    viewGame: (name: string) => `Ver ${name}`,
  },
  dynamics: {
    title: "Torneos y dinámicas",
    subtitle: "Participa y gana premios",
    listAriaLabel: "Torneos y dinámicas",
    playersLabel: (count: number) => `${count} Jugadores`,
    raffleRequirement: (gameCount: number) => `Quienes prueben los ${gameCount} juegos`,
    openLabel: (title: string) => `Ver ${title}`,
    logoParts: ["VIDE", "JUEG", "S"],
    logoLabel: "Videojuegos",
  },
  program: {
    title: "Programa del evento",
    subtitle: "¡No te quedes con las ganas!",
    scheduleHeading: "Horario",
    countdownLabel: "Tiempo faltante para el evento",
    units: { days: "Días", hours: "Horas", minutes: "Minutos", seconds: "Segundos" },
    brand: "UTGAMES",
    scheduleTimeLabel: (title: string, time: string, zone: string) => `${title}, ${time}, ${zone}`,
    countdownSummary: (days: number, hours: number, minutes: number) =>
      `Faltan ${days} días, ${hours} horas y ${minutes} minutos.`,
  },
} as const;
