"use client";

import { useRef, type ReactNode } from "react";
import { useVideoPlayback } from "@features/event/hooks/use-video-playback";
import { EVENT_COPY } from "@features/event/lib/event-copy";
import type { EventReelMedia } from "@features/event/lib/types";

interface EventReelProps {
  reel: EventReelMedia;
  /** Contenido del encabezado sobre el video. */
  children: ReactNode;
}

/** Encabezado con el reel de fondo, código de tiempo y botón de pausa (`.vh`). */
export function EventReel({ reel, children }: Readonly<EventReelProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { hasSource } = useVideoPlayback(videoRef);

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
        className="absolute inset-0 -z-2 size-full object-cover contrast-[1.05] saturate-[.85]"
      >
        {hasSource && reel.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
      </video>
      <div aria-hidden="true" className="absolute inset-0 -z-1 shade-reel" />
      {children}
    </header>
  );
}
