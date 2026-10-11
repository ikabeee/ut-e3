import type { EventReelMedia } from "@features/event/lib/types";

/**
 * Video del encabezado de la portada. Las fuentes van de la más ligera a la más compatible.
 * Para cambiar el reel reemplaza los archivos de `public/media/` (mismo nombre).
 */
export const EVENT_REEL: EventReelMedia = {
  poster: "/media/reel.jpg",
  sources: [
    { src: "/media/reel.webm", type: "video/webm" },
    { src: "/media/reel.mp4", type: "video/mp4" },
  ],
  framesPerSecond: 30,
};

/**
 * Ancho mínimo de pantalla (px) para descargar y reproducir el reel automáticamente. Debajo de
 * este ancho (teléfonos y tabletas en vertical) sólo se ve el póster y el video se carga al
 * tocar "Reproducir video".
 */
export const REEL_AUTOPLAY_MIN_WIDTH = 1024;

/** Media query de pantalla ancha que habilita la reproducción automática del reel. */
export const REEL_AUTOPLAY_MEDIA_QUERY = `(min-width: ${REEL_AUTOPLAY_MIN_WIDTH}px)`;

/** Condiciones del navegador que deciden si el reel se descarga y reproduce solo. */
export interface ReelAutoplayConditions {
  isWideScreen: boolean;
  prefersSaveData: boolean;
  prefersReducedMotion: boolean;
}

/** El reel sólo arranca solo en pantalla ancha, sin ahorro de datos y sin movimiento reducido. */
export function canAutoplayReel({ isWideScreen, prefersSaveData, prefersReducedMotion }: ReelAutoplayConditions) {
  return isWideScreen && !prefersSaveData && !prefersReducedMotion;
}

/** Código de tiempo del reel en minutos, segundos y cuadros: 75.5 s -> "01:15:15". */
export function formatTimecode(seconds: number, framesPerSecond: number = EVENT_REEL.framesPerSecond) {
  const pad = (value: number) => String(Math.floor(value)).padStart(2, "0");
  return `${pad(seconds / 60)}:${pad(seconds % 60)}:${pad((seconds % 1) * framesPerSecond)}`;
}
