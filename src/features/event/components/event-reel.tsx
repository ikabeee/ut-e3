"use client";

import { useRef, type ReactNode } from "react";
import { ToggleButton } from "@heroui/react";
import { useVideoPlayback } from "@features/event/hooks/use-video-playback";
import { EVENT_REEL } from "@features/event/lib/event-media";

interface EventReelProps {
  reelLabel: string;
  /** Contenido del encabezado sobre el video. */
  children: ReactNode;
}

// Degradado inferior para leer el texto y líneas de escaneo encima del video.
const SHADE_BACKGROUND =
  "linear-gradient(0deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 38%,rgba(0,0,0,.15) 70%,rgba(0,0,0,.45) 100%),repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px)";

/** Encabezado con el reel de fondo, código de tiempo y botón de pausa (`.vh`). */
export function EventReel({ reelLabel, children }: Readonly<EventReelProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPaused, timecode, togglePlayback, shouldAutoplay } = useVideoPlayback(videoRef);

  return (
    <header
      id="top"
      aria-label="UTG Showcase"
      className="relative isolate flex h-[clamp(560px,calc(100svh-56px),1000px)] items-end overflow-hidden border-b border-border bg-background"
    >
      <video
        ref={videoRef}
        autoPlay={shouldAutoplay}
        muted
        loop
        playsInline
        preload="auto"
        poster={EVENT_REEL.poster}
        aria-hidden="true"
        className="absolute inset-0 -z-2 size-full object-cover contrast-[1.05] saturate-[.85]"
      >
        {EVENT_REEL.sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      <div aria-hidden="true" className="absolute inset-0 -z-1" style={{ background: SHADE_BACKGROUND }} />

      {children}

      <div
        aria-hidden="true"
        className="absolute right-[calc(var(--gutter)+56px)] bottom-[22px] left-gutter flex justify-between gap-3 font-mono text-[11px] font-medium tracking-[.08em] text-copy-dim uppercase tabular-nums"
      >
        <span className="text-foreground max-[640px]:hidden">● {reelLabel}</span>
        <span>{timecode}</span>
      </div>
      <ToggleButton
        isSelected={isPaused}
        onChange={togglePlayback}
        aria-label={isPaused ? "Reproducir video" : "Pausar video"}
        className="group absolute right-gutter bottom-3 grid h-[34px] w-10 min-w-0 place-items-center rounded-none border border-foreground bg-black/60 p-0 active:transform-none data-[selected=true]:bg-black/60 hover:bg-foreground data-[selected=true]:hover:bg-foreground"
      >
        {isPaused ? (
          <span className="block size-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-foreground group-hover:border-l-background" />
        ) : (
          <span className="block h-3 w-2.5 border-x-[3px] border-foreground group-hover:border-background" />
        )}
      </ToggleButton>
    </header>
  );
}
