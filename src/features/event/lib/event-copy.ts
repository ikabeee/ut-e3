/**
 * Textos de la interfaz de `event`: títulos de sección, botones y nombres accesibles. El
 * contenido del evento (fecha, sede, programa y actividades) no va aquí: vive en
 * `event-info.ts` y `event-program.ts`, y los componentes lo reciben por props.
 */
export const EVENT_COPY = {
  hero: {
    logoLabel: "UTG",
  },
  reel: {
    label: "UTG Showcase",
    play: "Reproducir video",
    pause: "Pausar video",
  },
  venue: {
    heading: "Ubicación",
    kicker: "Sede",
    openMaps: "Abrir en Google Maps",
  },
  copyAddress: {
    idle: "Copiar dirección",
    copied: "Dirección copiada",
    failed: "No se pudo copiar",
  },
  venueMap: {
    label: (venueShortName: string) =>
      `Esquema: la ${venueShortName} está sobre la carretera Cancún–Aeropuerto, entre el centro y el aeropuerto`,
    sea: "Caribe",
    downtown: "Centro de Cancún",
    airport: "Aeropuerto",
    notToScale: "Esquema sin escala",
  },
} as const;
