"use client";

import { useRef, type ReactNode } from "react";
import { ToggleButton } from "@heroui/react";
import { useVideoPlayback } from "@features/event/hooks/use-video-playback";
import { EVENT_COPY } from "@features/event/lib/event-copy";
import type { EventReelMedia } from "@features/event/lib/types";

interface EventReelProps {
  reel: EventReelMedia;
  reelLabel: string;
  /** Contenido del encabezado sobre el video. */
  children: ReactNode;
}

/** Encabezado con el reel de fondo, código de tiempo y botón de pausa (`.vh`). */
export function EventReel({ reel, reelLabel, children }: Readonly<EventReelProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPaused, hasSource, timecode, togglePlayback } = useVideoPlayback(videoRef);

  return (
    <header
      id="top"
      aria-label={EVENT_COPY.reel.label}
      className="relative isolate flex h-[clamp(560px,calc(100svh-56px),1000px)] items-end overflow-hidden border-b border-border bg-background"
    >
      {/* Sin `autoPlay` ni fuentes en el HTML: el póster se ve de inmediato y el video sólo se
          descarga cuando `useVideoPlayback` lo decide en el cliente. */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster={reel.poster}
        aria-hidden="true"
        className="absolute inset-0 -z-2 size-full object-cover contrast-[1.05] saturate-[.85]"
      >
        {hasSource && reel.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
      </video>
      {/* Degradado inferior para leer el texto y líneas de escaneo encima del video. */}
      <div aria-hidden="true" className="absolute inset-0 -z-1 shade-reel" />

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
        aria-label={isPaused ? EVENT_COPY.reel.play : EVENT_COPY.reel.pause}
        className="toggle-button--overlay group absolute right-gutter bottom-[7px] grid size-11 place-items-center"
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
