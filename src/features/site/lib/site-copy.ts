/** Textos de la interfaz del sitio: navegación, página 404 y página de error. */
export const SITE_COPY = {
  header: {
    navigationLabel: "Principal",
    homeLinkLabel: "UTG, inicio",
  },
  navigation: {
    home: "Inicio",
    games: "Juegos",
    floorPlan: "Croquis",
    dynamics: "Dinámicas",
    program: "Programa",
    /** La página se llama "Pasaporte"; en la navegación basta "Mi QR" para que quepa en 360 px. */
    passport: "Mi QR",
  },
  notFound: {
    title: "Página no encontrada",
    kicker: "Error 404",
    description:
      "La página que buscas no existe o cambió de dirección. Explora el catálogo para encontrar tu próximo juego.",
    action: "Ver todos los juegos",
  },
  error: {
    /** Título de la pestaña: los error boundaries no admiten `metadata`. */
    documentTitle: (siteName: string) => `Algo salió mal · ${siteName}`,
    kicker: "Error",
    title: "Algo salió mal",
    description:
      "No pudimos cargar esta página. Intenta de nuevo en unos segundos o vuelve al inicio para seguir explorando.",
    digest: (digest: string) => `Código: ${digest}`,
    retry: "Reintentar",
    home: "Ir al inicio",
  },
} as const;
