"use client";

import { useRef } from "react";
import { Button } from "@heroui/react";
import { useVideoPlayback } from "@features/landing/hooks/use-video-playback";
import { HERO_LOOP } from "@features/landing/lib/hero-loop";
import { SHOWCASE_COPY } from "@features/showcase/lib/showcase-copy";
import { SHOWCASE_REEL_SECTION_ID } from "@features/showcase/lib/showcase-links";

const { reel } = SHOWCASE_COPY;

/** The full-width reel: it comes in tilted and straightens while scrolling (`scroll-settle`). */
export function ShowcaseReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying, hasSource, togglePlayback } = useVideoPlayback(videoRef);

  return (
    <section
      id={SHOWCASE_REEL_SECTION_ID}
      aria-label={reel.label}
      className="overflow-hidden py-[clamp(24px,4vw,64px)]"
    >
      <div className="page-wrap">
        <div className="relative aspect-video scroll-settle overflow-hidden border border-border bg-surface [--settle-tilt:-5deg]">
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={HERO_LOOP.poster}
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          >
            {hasSource &&
              HERO_LOOP.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
          </video>
          <div className="absolute inset-0 grid place-items-center bg-black/25">
            <Button variant="outline" onPress={togglePlayback} className="min-h-11 bg-black/70">
              {isPlaying ? reel.pause : reel.play}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
