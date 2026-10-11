import { useCallback, useEffect, useState, type RefObject } from "react";
import { useReelAutoplay } from "@features/event/hooks/use-reel-autoplay";
import { formatTimecode } from "@features/event/lib/event-media";

/**
 * Reproducción del video de fondo: carga bajo demanda, pausa/reproduce y código de tiempo.
 *
 * El video no tiene fuentes (`hasSource`) hasta que se necesitan, así la página no descarga el
 * reel al cargar. En pantalla ancha, sin ahorro de datos y sin movimiento reducido se cargan y
 * el reel se reproduce solo en cuanto es visible. En cualquier otro caso se queda el póster y
 * el botón de reproducir carga el video.
 */
export function useVideoPlayback(videoRef: RefObject<HTMLVideoElement | null>) {
  const [isPaused, setIsPaused] = useState(true);
  const [hasSource, setHasSource] = useState(false);
  // Cada petición de reproducir incrementa el contador; el efecto reproduce cuando ya hay fuentes.
  const [playRequest, setPlayRequest] = useState(0);
  const [timecode, setTimecode] = useState(formatTimecode(0));
  const canAutoplay = useReelAutoplay();

  const requestPlay = useCallback(() => {
    setHasSource(true);
    setPlayRequest((request) => request + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const syncPaused = () => setIsPaused(video.paused);
    const syncTime = () => setTimecode(formatTimecode(video.currentTime));
    video.addEventListener("play", syncPaused);
    video.addEventListener("pause", syncPaused);
    video.addEventListener("timeupdate", syncTime);
    return () => {
      video.removeEventListener("play", syncPaused);
      video.removeEventListener("pause", syncPaused);
      video.removeEventListener("timeupdate", syncTime);
    };
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (hasSource && video && playRequest > 0) {
      video.play().catch(() => setIsPaused(true));
    }
  }, [hasSource, playRequest, videoRef]);

  // Reproducción automática: sólo si el cliente lo permite y cuando el reel está a la vista.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (!canAutoplay) {
      // Si la persona activa el movimiento reducido o el ahorro de datos, el reel se detiene.
      video.pause();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        requestPlay();
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [canAutoplay, requestPlay, videoRef]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      requestPlay();
    } else {
      video.pause();
    }
  }, [requestPlay, videoRef]);

  return { isPaused, hasSource, timecode, togglePlayback };
}
