import { useCallback, useEffect, useState, type RefObject } from "react";
import { useReelAutoplay } from "@features/landing/hooks/use-reel-autoplay";

type VideoRef = RefObject<HTMLVideoElement | null>;

const FRAMES_PER_SECOND = 30;

export function useVideoPlayback(videoRef: VideoRef) {
  const [hasSource, setHasSource] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const canAutoplay = useReelAutoplay();
  const { isPlaying, timecode, markStopped } = useVideoState(videoRef);

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

  return { isPlaying, hasSource, timecode, togglePlayback };
}

function useVideoState(videoRef: VideoRef) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timecode, setTimecode] = useState(formatTimecode(0));
  const markStopped = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const markPlaying = () => setIsPlaying(true);
    const markPaused = () => setIsPlaying(false);
    const syncTimecode = () => setTimecode(formatTimecode(video.currentTime));
    video.addEventListener("play", markPlaying);
    video.addEventListener("pause", markPaused);
    video.addEventListener("timeupdate", syncTimecode);

    return () => {
      video.removeEventListener("play", markPlaying);
      video.removeEventListener("pause", markPaused);
      video.removeEventListener("timeupdate", syncTimecode);
    };
  }, [videoRef]);

  return { isPlaying, timecode, markStopped };
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

function formatTimecode(seconds: number) {
  const minutes = padTwoDigits(seconds / 60);
  const wholeSeconds = padTwoDigits(seconds % 60);
  const frames = padTwoDigits((seconds % 1) * FRAMES_PER_SECOND);

  return `${minutes}:${wholeSeconds}:${frames}`;
}

function padTwoDigits(value: number) {
  return String(Math.floor(value)).padStart(2, "0");
}
