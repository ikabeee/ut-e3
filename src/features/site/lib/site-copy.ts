export const SITE_COPY = {
  emergency: {
    lowDiskSubject: "Disco de la base casi lleno",
    lowDiskDetail: (freeMegabytes: number) =>
      `Al volumen de la base le quedan ${freeMegabytes} MB y GET /api/health responde 503. Con el disco lleno SQLite falla (SQLITE_FULL) y los kioscos dejan de registrar visitas.`,
  },
  nav: {
    label: "Principal",
    homeLabel: "UTG, inicio",
    links: {
      home: "Inicio",
      games: "Juegos",
      floorPlan: "Croquis",
      sponsors: "Patrocinadores",
      raffle: "Rifa",
      tournament: "KOF",
      help: "Ayuda",
    },
    passport: "Mi pasaporte",
    search: {
      formLabel: "Buscar juegos",
      label: "Busca un juego",
      submit: "Buscar",
      suggestionsLabel: "Juegos sugeridos",
      noMatches: "Ningún juego coincide. Presiona Buscar para ver el catálogo.",
      resultCount: (count: number) => (count === 1 ? "1 juego" : `${count} juegos`),
    },
    openMenu: "Abrir menú",
    menuTitle: "Menú",
    closeMenu: "Cerrar menú",
  },
  help: {
    title: "¿A quién acudo?",
    kicker: "Ayuda",
    description: "Qué hacer si algo falla en tu visita al UT Game Showcase: elige tu caso y sigue el paso.",
    lead: "Elige tu caso. Si no aparece aquí, acude a la mesa de atención del evento.",
    topicsLabel: "Problemas frecuentes",
    desk: "la mesa de atención",
    passportLink: "Abrir mi pasaporte",
    topics: {
      lostPhone: {
        title: "Perdí o cambié mi teléfono",
        solution: (desk: string) => `Recupera tu pasaporte con tu correo o pídelo en ${desk}.`,
        link: "Recuperar mi pasaporte",
      },
      noEmail: {
        title: "No me llegó el correo",
        solution: (desk: string) =>
          `Abre tu pasaporte en el teléfono donde te registraste. Si no aparece, acude a ${desk}.`,
      },
      standVisit: {
        title: "Mi visita no se registró",
        solution: "Avisa al staff del stand y muéstrale tu PIN otra vez.",
      },
      tickets: {
        title: "Dudas con mis boletos",
        solution: (ticketsTitle: string, desk: string) =>
          `Míralos en tu pasaporte, en «${ticketsTitle}». Si algo no cuadra, pregunta en ${desk}.`,
      },
      kof: {
        title: "Quiero jugar el torneo de KOF",
        solution: (enrollButton: string) => `Toca «${enrollButton}» en tu pasaporte o inscríbete en el área de KOF.`,
        link: "Ver el torneo",
      },
      offline: {
        title: "No tengo conexión",
        solution: "Tu pasaporte abre desde la copia guardada en tu teléfono.",
      },
    },
  },
  notFound: {
    title: "Página no encontrada",
    kicker: "Error 404",
    code: "404",
    description:
      "La página que buscas no existe o cambió de dirección. Si llegaste por un enlace o un QR viejo, sigue por aquí.",
    action: "Volver al inicio",
    exitsHeading: "Sigue explorando",
    exits: {
      games: { label: "Juegos", description: "El catálogo completo del showcase." },
      floorPlan: { label: "Croquis", description: "Dónde está cada stand en la sede." },
      schedule: { label: "Cronograma", description: "Actividades y horarios del evento." },
    },
  },
  toasts: {
    label: "Avisos",
  },
  error: {
    // Error boundaries take no `metadata`, so the view sets the tab title itself.
    documentTitle: (siteName: string) => `Algo salió mal · ${siteName}`,
    kicker: "Error",
    title: "Algo salió mal",
    description:
      "No pudimos cargar esta página. Revisa tu conexión e intenta de nuevo en unos segundos, o vuelve al inicio.",
    digest: (digest: string) => `Código: ${digest}`,
    retry: "Reintentar",
    home: "Ir al inicio",
  },
};
