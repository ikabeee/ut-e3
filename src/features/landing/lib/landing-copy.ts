export const LANDING_COPY = {
  nav: {
    label: "Principal",
    homeLabel: "UTG, inicio",
    links: {
      home: "Inicio",
      games: "Juegos",
      floorPlan: "Croquis",
      sponsors: "Patrocinadores",
    },
  },
  hero: {
    label: "PIXEL & CODE",
    wordmark: "PIXEL & CODE",
    slogan: { lead: "JUEGA. CALIFICA.", accent: "GANA." },
    description: (division: string) =>
      `Juegos creados por la ${division}. Pruébalos, compite en los torneos y participa en la rifa.`,
    callToAction: "Quiero participar",
    playVideo: "Reproducir video",
  },
  acts: {
    heading: "Cómo participar",
    play: {
      word: "JUEGA",
      line: (gamesCount: number, division: string) => `${gamesCount} juegos hechos por estudiantes de la ${division}`,
    },
    rate: {
      word: "CALIFICA",
      line: (cutoffLabel: string) =>
        `Teclea tu PIN en cada stand y califica el juego, el stand y el arte. Con 9 visitas válidas ganas un boleto y con 18, otro. Las visitas cuentan hasta las ${cutoffLabel}.`,
      visits: (count: number) => `${count} visitas`,
      ticketGain: "+1 boleto",
    },
    win: {
      word: "GANA",
      kof: {
        title: "Torneo de KOF",
        line: (checkInLabel: string, onsiteSignupLabel: string) =>
          `64 jugadores · check-in ${checkInLabel} · inscripción presencial ${onsiteSignupLabel}`,
      },
      marioKart: { title: "Mario Kart", line: "Súbete cuando quieras" },
      raffle: {
        title: "Rifa",
        line: (startsAtLabel: string) => `${startsAtLabel} · con tus boletos`,
      },
    },
    marketplace: {
      title: "Marketplace",
      line: "Productos de la comunidad durante el evento.",
    },
    timeRange: (startLabel: string, endLabel: string) => `${startLabel} a ${endLabel}`,
  },
  activities: {
    requestSpot: "Solicitar un lugar",
    marketplaceClosed: "Registro de vendedores cerrado",
  },
  guests: {
    heading: "Invitadas especiales",
  },
  venue: {
    heading: "Ubicación",
    kicker: "Sede",
    openMaps: "Abrir en Google Maps",
    copyAddress: {
      idle: "Copiar dirección",
      copied: "Dirección copiada",
      failed: "No se pudo copiar",
    },
    map: {
      label: (venueShortName: string) =>
        `Esquema: la ${venueShortName} está sobre la carretera Cancún–Aeropuerto, entre el centro y el aeropuerto`,
      sea: "Caribe",
      downtown: "Centro de Cancún",
      airport: "Aeropuerto",
      notToScale: "Esquema sin escala",
    },
  },
  closing: {
    firstLine: "Entrada",
    secondLine: "libre",
  },
  footer: {
    credit: "Desarrollado y diseñado por",
    creditName: "Algorix Insights",
    creditUrl: "https://algorixinsights.com/",
  },
  calendar: {
    details: (division: string) => `Showcase de videojuegos de la ${division}. Entrada libre.`,
  },
} as const;
