"use client";

import { useRef } from "react";
import { cn } from "@heroui/react";
import { useVideoPlayback } from "@features/landing/hooks/use-video-playback";
import { HERO_LOOP } from "@features/landing/lib/hero-loop";

/** A clip of the hero loop that floats, tilted, over the event title. Decorative. */
export function HeroClip({ className }: Readonly<{ className?: string }>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { hasSource } = useVideoPlayback(videoRef);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none animate-float overflow-hidden border border-foreground/25 bg-surface shadow-[18px_18px_0_0_var(--utg-blue-5)] [--float-tilt:7deg]",
        className,
      )}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster={HERO_LOOP.poster}
        className="block aspect-4/3 w-full object-cover"
      >
        {hasSource &&
          HERO_LOOP.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
      </video>
    </div>
  );
}
