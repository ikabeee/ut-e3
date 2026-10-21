/**
 * Textos de la landing por sección, con las mayúsculas del Figma aplicadas por CSS (`uppercase` o
 * `capitalize`) donde el diseño las transforma. La fecha, la sede, la entrada y los horarios no se
 * escriben aquí: salen de `EVENT_INFO`, `EVENT_VENUE` y `EVENT_SCHEDULE` (feature `event`).
 */
export const LANDING_COPY = {
  wordmark: {
    // Nombre accesible del logotipo VIDE [+] JUEG [o] S, que se dibuja con piezas decorativas.
    label: "Videojuegos",
  },
  hero: {
    kicker: "Showcase",
    division: "División de Ingeniería",
    // "20 Nov 2026 • UT Cancún | Entrada Libre"
    dateLine: (date: string, venue: string, admission: string) => `${date} • ${venue} | ${admission}`,
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
  },
  program: {
    title: "Programa del evento",
    subtitle: "¡No te quedes con las ganas!",
    scheduleHeading: "Horario",
    countdownLabel: "Tiempo faltante para el evento",
    units: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
    brand: "UTGAMES",
    scheduleTimeLabel: (title: string, time: string, zone: string) => `${title}, ${time}, ${zone}`,
    countdownSummary: (days: number, hours: number, minutes: number) =>
      `Faltan ${days} días, ${hours} horas y ${minutes} minutos.`,
  },
} as const;
