"use client";

import { useRef, type RefObject } from "react";
import { ToggleButton } from "@heroui/react";
import { useVideoPlayback } from "@features/landing/hooks/use-video-playback";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { TOP_SECTION_ID } from "@features/landing/lib/landing-links";
import { ScrambleText } from "@shared/components/scramble-text";
import { UtgLogo } from "@shared/components/utg-logo";
import { siteConfig } from "@shared/lib/site-config";

const REEL_POSTER = "/media/reel.jpg";

const REEL_SOURCES = [
  { src: "/media/reel.webm", type: "video/webm" },
  { src: "/media/reel.mp4", type: "video/mp4" },
] as const;

const ARROW_GLYPH = "↗";

const GLYPH_CLASS = "grid size-5 place-items-center font-mono text-lg leading-none font-bold";

const SLICE_CLASS = `${GLYPH_CLASS} pointer-events-none absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 opacity-0`;

interface VideoHeroProps {
  kicker: string;
  calendarUrl: string;
}

export function VideoHero({ kicker, calendarUrl }: Readonly<VideoHeroProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying, hasSource, timecode, togglePlayback } = useVideoPlayback(videoRef);

  return (
    <header
      id={TOP_SECTION_ID}
      aria-label={LANDING_COPY.hero.label}
      className="relative isolate flex h-[clamp(560px,calc(100svh-var(--nav-height)),1000px)] items-end overflow-hidden border-b border-border bg-background"
    >
      <ReelVideo videoRef={videoRef} hasSource={hasSource} />
      <div aria-hidden="true" className="absolute inset-0 -z-1 shade-reel" />
      <HeroContent kicker={kicker} calendarUrl={calendarUrl} />
      <ReelControls isPlaying={isPlaying} timecode={timecode} onToggle={togglePlayback} />
    </header>
  );
}

interface ReelVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  hasSource: boolean;
}

function ReelVideo({ videoRef, hasSource }: Readonly<ReelVideoProps>) {
  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      poster={REEL_POSTER}
      aria-hidden="true"
      className="absolute inset-0 -z-2 size-full object-cover contrast-[1.05] saturate-[.85]"
    >
      {hasSource && REEL_SOURCES.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
    </video>
  );
}

function HeroContent({ kicker, calendarUrl }: Readonly<VideoHeroProps>) {
  const { hero } = LANDING_COPY;

  return (
    <div className="page-wrap flex w-full flex-col items-start gap-[clamp(14px,1.8vw,22px)] pb-[clamp(72px,9vw,120px)]">
      <p className="m-0 font-mono text-xs font-medium tracking-[.08em] text-copy-strong uppercase">{kicker}</p>
      <h1 className="m-0 flex flex-col gap-[clamp(8px,1vw,14px)]">
        <UtgLogo variant="flat" label={hero.logoLabel} className="block h-auto w-[clamp(220px,34vw,520px)]" />
        <span className="font-wide text-[clamp(18px,2.6vw,38px)] leading-none font-bold tracking-[-.03em] uppercase">
          {LANDING_COPY.title}
        </span>
      </h1>
      <p className="m-0 max-w-[52ch] text-[clamp(15px,1.3vw,18px)] leading-[1.45] text-copy">
        {hero.description(siteConfig.organization.division)}
      </p>
      <HeroCtaLink href={calendarUrl}>{hero.callToAction}</HeroCtaLink>
    </div>
  );
}

interface HeroCtaLinkProps {
  href: string;
  children: string;
}

function HeroCtaLink({ href, children }: Readonly<HeroCtaLinkProps>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex fill-wipe items-stretch p-0 font-mono text-sm font-bold text-background uppercase no-underline [--wipe-base:var(--utg-white)] [--wipe-fill:var(--accent)] [--wipe-ink:var(--utg-black)] max-[640px]:w-full max-[640px]:justify-between"
    >
      <ScrambleText text={children} className="flex items-center px-5 py-4" />
      <GlitchArrow />
    </a>
  );
}

function GlitchArrow() {
  return (
    <span
      aria-hidden="true"
      className="relative grid w-[52px] place-items-center bg-accent text-background transition-colors duration-200 group-hover:bg-background group-hover:text-accent"
    >
      <span className={`${GLYPH_CLASS} glitch-layer-base group-hover:[animation-duration:.5s]`}>{ARROW_GLYPH}</span>
      <span className={`${SLICE_CLASS} glitch-layer-a text-accent-deep group-hover:[animation-duration:.5s]`}>
        {ARROW_GLYPH}
      </span>
      <span className={`${SLICE_CLASS} glitch-layer-b text-accent-hi group-hover:[animation-duration:.5s]`}>
        {ARROW_GLYPH}
      </span>
    </span>
  );
}

interface ReelControlsProps {
  isPlaying: boolean;
  timecode: string;
  onToggle: () => void;
}

function ReelControls({ isPlaying, timecode, onToggle }: Readonly<ReelControlsProps>) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute right-[calc(max(var(--gutter),env(safe-area-inset-right,0px))+56px)] bottom-[22px] left-[max(var(--gutter),env(safe-area-inset-left,0px))] flex justify-between gap-3 font-mono text-[11px] tracking-[.08em] text-copy-dim uppercase tabular-nums"
      >
        <span className="text-foreground max-[640px]:hidden">{LANDING_COPY.hero.reelBadge}</span>
        <span>{timecode}</span>
      </div>
      <ToggleButton
        isSelected={isPlaying}
        onChange={onToggle}
        aria-label={LANDING_COPY.hero.playVideo}
        className="toggle-button--overlay group absolute right-[max(var(--gutter),env(safe-area-inset-right,0px))] bottom-3 size-11"
      >
        <PlaybackIcon isPlaying={isPlaying} />
      </ToggleButton>
    </>
  );
}

function PlaybackIcon({ isPlaying }: Readonly<{ isPlaying: boolean }>) {
  if (isPlaying) {
    return (
      <span
        aria-hidden="true"
        className="block h-3 w-2.5 border-x-[3px] border-foreground group-hover:border-background"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block size-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-foreground group-hover:border-l-background"
    />
  );
}
