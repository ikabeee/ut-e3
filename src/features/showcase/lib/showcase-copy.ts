export const SHOWCASE_COPY = {
  page: {
    title: "Vitrina del evento",
  },
  hero: {
    badge: (dateLabel: string, venueName: string) => `${dateLabel} · ${venueName}`,
    scrollCue: "Desliza para explorar",
  },
  reel: {
    label: "Video del evento",
    play: "Reproducir video",
    pause: "Pausar video",
  },
  games: {
    marquee: "JUEGOS -",
  },
  closing: {
    label: "Cierre",
    backToTop: "Volver arriba",
    linksLabel: "Más del showcase",
  },
} as const;
