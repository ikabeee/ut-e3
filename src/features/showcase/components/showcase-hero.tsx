import { Chip } from "@heroui/react";
import { LedWordmark } from "@features/landing/components/led-wordmark";
import { HeroClip } from "@features/showcase/components/hero-clip";
import { PixelMark } from "@features/showcase/components/pixel-mark";
import { PixelStairs } from "@features/showcase/components/pixel-stairs";
import { DOTTED_CELL_INSET, SOLID_CELL_INSET } from "@features/showcase/lib/led-insets";
import { SHOWCASE_COPY } from "@features/showcase/lib/showcase-copy";
import { SHOWCASE_REEL_SECTION_ID, SHOWCASE_TOP_SECTION_ID } from "@features/showcase/lib/showcase-links";
import type { ShowcaseLink, ShowcaseTitle } from "@features/showcase/lib/types";
import { ActionLink } from "@shared/components/action-link";

const { hero } = SHOWCASE_COPY;

interface ShowcaseHeroProps {
  title: ShowcaseTitle;
  /** Date and venue of the event. */
  badge: string;
  description: string;
  /** "Crear mi pasaporte". */
  cta: ShowcaseLink;
}

/** The top of /showcase: the LED title in two lines, the floating clip, the introduction and the passport CTA. */
export function ShowcaseHero({ title, badge, description, cta }: Readonly<ShowcaseHeroProps>) {
  return (
    <header id={SHOWCASE_TOP_SECTION_ID} className="relative isolate overflow-hidden pt-[clamp(28px,6vw,88px)]">
      <PixelStairs className="-z-1 text-accent opacity-[.07]" />
      <div className="relative page-wrap">
        <HeroTitle title={title} />
        <HeroClip className="absolute top-0 right-[3%] w-[clamp(140px,20vw,340px)] max-[640px]:hidden" />
      </div>
      <div className="page-wrap mt-[clamp(36px,6vw,96px)] grid gap-8 pb-[clamp(40px,6vw,80px)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="flex flex-col items-start gap-6">
          <HeroIntro badge={badge} description={description} />
          <ActionLink href={cta.href} variant="primary" arrow="e" className="min-h-11 max-[640px]:w-full">
            {cta.label}
          </ActionLink>
        </div>
        <a
          href={`#${SHOWCASE_REEL_SECTION_ID}`}
          className="touch-target relative flex items-center gap-3 justify-self-center type-tiny text-copy-dim no-underline hover:text-accent md:justify-self-end"
        >
          <PixelMark className="rotate-90" />
          {hero.scrollCue}
          <PixelMark className="-rotate-90" />
        </a>
      </div>
    </header>
  );
}

function HeroTitle({ title }: Readonly<{ title: ShowcaseTitle }>) {
  return (
    <h1 className="m-0 flex flex-col items-start gap-[clamp(10px,1.6vw,24px)]">
      <LedWordmark
        text={title.firstLine}
        label={title.firstLine}
        cellInset={SOLID_CELL_INSET}
        className="block h-[clamp(64px,15vw,250px)] w-auto max-w-full fill-accent"
      />
      <LedWordmark
        text={title.secondLine}
        label={title.secondLine}
        cellInset={DOTTED_CELL_INSET}
        className="block h-[clamp(48px,11vw,190px)] w-auto max-w-full self-end fill-foreground max-[640px]:self-start"
      />
    </h1>
  );
}

function HeroIntro({ badge, description }: Readonly<Pick<ShowcaseHeroProps, "badge" | "description">>) {
  return (
    <p className="m-0 max-w-[30ch] type-wide text-[clamp(18px,2.2vw,32px)] leading-[1.15] tracking-[-.02em]">
      <Chip className="mr-3 inline-flex translate-y-[-.2em] gap-2 rounded-none bg-accent px-2.5 py-1 align-middle font-mono text-[11px] font-medium tracking-[.08em] text-black">
        <PixelMark />
        {badge}
      </Chip>
      {description}
    </p>
  );
}
