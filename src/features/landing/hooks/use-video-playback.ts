import { useCallback, useEffect, useState, type RefObject } from "react";
import { useLoopAutoplay } from "@features/landing/hooks/use-loop-autoplay";

type VideoRef = RefObject<HTMLVideoElement | null>;

export function useVideoPlayback(videoRef: VideoRef) {
  const [hasSource, setHasSource] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const canAutoplay = useLoopAutoplay();
  const { isPlaying, markStopped } = useVideoState(videoRef);

  const requestPlay = useCallback(() => {
    setHasSource(true);
    setPlayRequest((request) => request + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (hasSource && video && playRequest > 0) {
      video.play().catch(markStopped);
    }
  }, [hasSource, playRequest, videoRef, markStopped]);

  useAutoplayWhenVisible(videoRef, canAutoplay, requestPlay);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;

    if (video?.paused) {
      requestPlay();
    } else {
      video?.pause();
    }
  }, [requestPlay, videoRef]);

  return { isPlaying, hasSource, togglePlayback };
}

function useVideoState(videoRef: VideoRef) {
  const [isPlaying, setIsPlaying] = useState(false);
  const markStopped = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const markPlaying = () => setIsPlaying(true);
    const markPaused = () => setIsPlaying(false);
    video.addEventListener("play", markPlaying);
    video.addEventListener("pause", markPaused);

    return () => {
      video.removeEventListener("play", markPlaying);
      video.removeEventListener("pause", markPaused);
    };
  }, [videoRef]);

  return { isPlaying, markStopped };
}

function useAutoplayWhenVisible(videoRef: VideoRef, canAutoplay: boolean, requestPlay: () => void) {
  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!canAutoplay) {
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
}
