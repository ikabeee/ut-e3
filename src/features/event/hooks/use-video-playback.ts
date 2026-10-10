import { useCallback, useEffect, useState, type RefObject } from "react";
import { formatTimecode } from "@features/event/lib/event-media";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/**
 * Reproducción del video de fondo: pausa/reproduce y código de tiempo. Si la persona
 * prefiere reducir el movimiento, el video empieza en pausa.
 */
export function useVideoPlayback(videoRef: RefObject<HTMLVideoElement | null>) {
  const [isPaused, setIsPaused] = useState(false);
  const [timecode, setTimecode] = useState(formatTimecode(0));
  const prefersReducedMotion = usePrefersReducedMotion();

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
    if (prefersReducedMotion) {
      video.pause();
    }
    return () => {
      video.removeEventListener("play", syncPaused);
      video.removeEventListener("pause", syncPaused);
      video.removeEventListener("timeupdate", syncTime);
    };
  }, [prefersReducedMotion, videoRef]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  }, [videoRef]);

  return { isPaused, timecode, togglePlayback, shouldAutoplay: !prefersReducedMotion };
}
