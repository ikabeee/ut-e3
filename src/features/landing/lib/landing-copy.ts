export const LANDING_COPY = {
  title: "Showcase de videojuegos",
  lead: "Estamos preparando la nueva versión del sitio.",
  nav: {
    label: "Principal",
    homeLabel: "UTG, inicio",
  },
  hero: {
    label: "UTG Showcase",
    logoLabel: "UTG",
    description: (division: string) =>
      `Juegos creados por la ${division}. Pruébalos, compite en los torneos y participa en la rifa.`,
    callToAction: "Quiero participar",
    reelBadge: "● Reel",
    playVideo: "Reproducir video",
  },
  event: {
    firstLine: "Juegos hechos",
    secondLine: (universityShortName: string) => `en la ${universityShortName}`,
    lead: (division: string) =>
      `Los equipos de la ${division} presentan los videojuegos que desarrollaron. Cada equipo tiene un stand con su juego listo para jugar.`,
    details:
      "Recorre los stands, prueba las demos y platica con quienes los hicieron. Durante el día hay torneos, rifa y mercado local. La entrada es libre.",
  },
  activities: {
    raffle: {
      kicker: "Main stage",
      title: "Rifa",
      body: (cutoffLabel: string) =>
        `Gana un boleto al llegar a 9 visitas válidas a los stands y otro al llegar a 18. Las visitas cuentan hasta las ${cutoffLabel}.`,
      startsAt: "Inicia",
      maximum: "Máximo",
      maximumValue: "2 boletos",
    },
    marketplace: {
      kicker: "Mercado local",
      title: "Marketplace",
      body: "Productos de la comunidad a la venta durante el evento. Solicita un lugar si quieres vender.",
      kind: "Tipo",
      kindValue: "Informativo",
    },
    kof: {
      kicker: "Arena de torneos",
      title: "Torneo de KOF",
      body: "Torneo de 64 jugadores con eliminación directa. Regístrate con tu pasaporte o, el día del evento, escaneando tu QR.",
      format: "Formato",
      formatValue: "Eliminación directa",
      opensAt: "Abre registro",
      closesAt: "Cierra registro",
    },
    marioKart: {
      kicker: "Zona de juego",
      title: "Mario Kart",
      body: "Actividad solo informativa. Consulta el cronograma para conocer su horario.",
      kind: "Tipo",
      kindValue: "Informativo",
    },
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
} as const;
