/** Textos de la interfaz sin conexión: avisos de conexión y de actualización, y página /offline. */
export const OFFLINE_COPY = {
  banner: "Sin conexión. Lo que ya visitaste sigue disponible.",
  update: {
    message: "Hay una versión nueva del sitio.",
    action: "Actualizar",
  },
  page: {
    metaTitle: "Sin conexión",
    metaDescription: "Esta página no está guardada en tu dispositivo. Vuelve a las secciones disponibles sin conexión.",
    kicker: "Sin conexión",
    title: "Estás sin conexión",
    description:
      "Esta página no está guardada en tu dispositivo. El catálogo, el detalle de cada juego y el croquis siguen disponibles sin internet.",
    navigationLabel: "Secciones disponibles sin conexión",
    links: {
      home: "Inicio",
      games: "Juegos",
      floorPlan: "Croquis",
    },
  },
} as const;
