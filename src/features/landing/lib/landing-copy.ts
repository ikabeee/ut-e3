export const LANDING_COPY = {
  hero: {
    label: "PIXEL & CODE",
    wordmark: "PIXEL & CODE",
    slogan: { lead: "JUEGA. CALIFICA.", accent: "GANA." },
    description: (division: string) =>
      `Juegos creados por la ${division}. Pruébalos, compite en los torneos y participa en la rifa.`,
    callToAction: "Agregar al calendario",
    createPassport: "Crear mi pasaporte",
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
    heading: "Invitados especiales",
    carouselLabel: "Invitados especiales: usa las flechas del teclado para cambiar de pase",
    announcement: (current: number, total: number, name: string) =>
      `Pase ${toTwoDigits(current)} de ${toTwoDigits(total)}: ${name}`,
    photoPending: "Por anunciar",
  },
  flyers: {
    heading: "Carteles del evento",
    alt: {
      fair: "Cartel de la feria de exhibición de videojuegos, con acceso gratuito",
      tournament: "Cartel del torneo de videojuegos de The King of Fighters",
    },
  },
  venue: {
    heading: "Ubicación",
    openMaps: "Abrir en Google Maps",
    copyAddress: {
      idle: "Copiar dirección",
      copied: "Dirección copiada",
      failed: "No se pudo copiar",
    },
    map: {
      regionLabel: (venueBuilding: string, venueShortName: string) =>
        `Mapa de la ubicación del evento: ${venueBuilding}, ${venueShortName}`,
      zoomIn: "Acercar",
      zoomOut: "Alejar",
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
    sitemap: {
      label: "Mapa del sitio",
      groups: { event: "Evento", pages: "Páginas" },
      links: {
        games: "Juegos",
        activities: "Actividades",
        guests: "Invitados especiales",
        sponsors: "Patrocinadores",
        schedule: "Cronograma",
        floorPlan: "Croquis",
        venue: "Ubicación",
        gamesCatalog: "Catálogo de juegos",
        floorPlanPage: "Croquis completo",
        raffle: "Ganadores de la rifa",
        tournament: "Tabla de posiciones",
        passport: "Mi pasaporte",
      },
    },
  },
  calendar: {
    details: (division: string) => `Showcase de videojuegos de la ${division}. Entrada libre.`,
  },
} as const;

function toTwoDigits(value: number) {
  return String(value).padStart(2, "0");
}
