"use client";

import { useRef, type RefObject } from "react";
import { HeroLoopSources } from "@features/landing/components/hero-loop-sources";
import { LedWordmark } from "@features/landing/components/led-wordmark";
import { useVideoPlayback } from "@features/landing/hooks/use-video-playback";
import { HERO_LOOP } from "@features/landing/lib/hero-loop";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { TOP_SECTION_ID } from "@features/landing/lib/landing-links";
import { ActionLink } from "@shared/components/action-link";
import { ScrambleText } from "@shared/components/scramble-text";
import { siteConfig } from "@shared/lib/site-config";

const ARROW_GLYPH = "↗";

const GLYPH_CLASS = "grid size-5 place-items-center font-mono text-lg leading-none font-bold";

const SLICE_CLASS = `${GLYPH_CLASS} pointer-events-none absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 opacity-0`;

interface VideoHeroProps {
  calendarUrl: string;
  /**
   * Where "Crear mi pasaporte" goes: the registration, which says by itself when it is not open yet. Without it the
   * button is left out (only the landing is published).
   */
  registerHref?: string;
}

export function VideoHero({ calendarUrl, registerHref }: Readonly<VideoHeroProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { hasSource } = useVideoPlayback(videoRef);

  return (
    <header
      id={TOP_SECTION_ID}
      aria-label={LANDING_COPY.hero.label}
      className="flex min-h-[clamp(560px,calc(100svh-var(--nav-height)),1000px)] items-center border-b border-border bg-background py-[clamp(24px,4vw,64px)]"
    >
      <div className="page-wrap grid w-full items-center gap-[clamp(24px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <HeroContent calendarUrl={calendarUrl} registerHref={registerHref} />
        <LoopPanel videoRef={videoRef} hasSource={hasSource} />
      </div>
    </header>
  );
}

interface LoopPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  hasSource: boolean;
}

function LoopPanel({ videoRef, hasSource }: Readonly<LoopPanelProps>) {
  return (
    <div className="relative order-first aspect-968/648 w-full lg:order-0">
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
        <HeroLoopSources hasSource={hasSource} />
      </video>
    </div>
  );
}

function HeroContent({ calendarUrl, registerHref }: Readonly<VideoHeroProps>) {
  const { hero } = LANDING_COPY;

  return (
    <div className="flex flex-col items-start gap-[clamp(14px,1.8vw,22px)]">
      <h1 className="m-0">
        <LedWordmark
          text={hero.wordmark}
          label={hero.wordmark}
          className="block h-auto w-[clamp(260px,40vw,600px)] fill-accent"
        />
      </h1>
      <p className="m-0 type-wide text-[clamp(18px,2.6vw,38px)] leading-none tracking-[-.03em]">
        {hero.slogan.lead} <span className="text-accent">{hero.slogan.accent}</span>
      </p>
      <p className="m-0 max-w-[52ch] text-[clamp(15px,1.3vw,18px)] leading-[1.45] text-copy">
        {hero.description(siteConfig.organization.division)}
      </p>
      <div className="flex flex-wrap items-stretch gap-3 max-[640px]:w-full max-[640px]:flex-col">
        <HeroCtaLink href={calendarUrl}>{hero.callToAction}</HeroCtaLink>
        {registerHref && (
          <ActionLink href={registerHref} variant="outline" arrow="e" className="min-h-11">
            {hero.createPassport}
          </ActionLink>
        )}
      </div>
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
      <span className={`${GLYPH_CLASS} glitch-layer-base group-hover:animation-duration-[.5s]`}>{ARROW_GLYPH}</span>
      <span className={`${SLICE_CLASS} glitch-layer-a text-accent-deep group-hover:animation-duration-[.5s]`}>
        {ARROW_GLYPH}
      </span>
      <span className={`${SLICE_CLASS} glitch-layer-b text-accent-hi group-hover:animation-duration-[.5s]`}>
        {ARROW_GLYPH}
      </span>
    </span>
  );
}
