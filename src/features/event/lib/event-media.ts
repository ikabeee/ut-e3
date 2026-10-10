/**
 * Video del encabezado de la portada. Las fuentes van de la más ligera a la más compatible.
 * Para cambiar el reel reemplaza los archivos de `public/media/` (mismo nombre).
 */
export const EVENT_REEL = {
  poster: "/media/reel.jpg",
  sources: [
    { src: "/media/reel.webm", type: "video/webm" },
    { src: "/media/reel.mp4", type: "video/mp4" },
  ],
  /** Cuadros por segundo del código de tiempo (00:00:00). */
  framesPerSecond: 30,
} as const;

/** Código de tiempo del reel en minutos, segundos y cuadros: 75.5 s -> "01:15:15". */
export function formatTimecode(seconds: number, framesPerSecond: number = EVENT_REEL.framesPerSecond) {
  const pad = (value: number) => String(Math.floor(value)).padStart(2, "0");
  return `${pad(seconds / 60)}:${pad(seconds % 60)}:${pad((seconds % 1) * framesPerSecond)}`;
}
