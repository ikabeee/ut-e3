import { Chip } from "@heroui/react";
import { LedWordmark } from "@features/landing/components/led-wordmark";
import { HeroClip } from "@features/studio/components/hero-clip";
import { PixelMark } from "@features/studio/components/pixel-mark";
import { DOTTED_CELL_INSET, SOLID_CELL_INSET } from "@features/studio/lib/led-insets";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_REEL_SECTION_ID, STUDIO_TOP_SECTION_ID } from "@features/studio/lib/studio-links";

const { hero } = STUDIO_COPY;

/** The top of /studio: the LED title in two lines, the floating clip and the introduction. */
export function StudioHero({ division }: Readonly<{ division: string }>) {
  return (
    <header id={STUDIO_TOP_SECTION_ID} className="relative isolate overflow-hidden pt-[clamp(28px,6vw,88px)]">
      <div className="relative page-wrap">
        <HeroTitle />
        <HeroClip className="absolute top-0 right-[3%] w-[clamp(140px,20vw,340px)] max-[640px]:hidden" />
      </div>
      <div className="page-wrap mt-[clamp(36px,6vw,96px)] grid gap-8 pb-[clamp(40px,6vw,80px)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <HeroIntro division={division} />
        <a
          href={`#${STUDIO_REEL_SECTION_ID}`}
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

function HeroTitle() {
  return (
    <h1 className="m-0 flex flex-col items-start gap-[clamp(10px,1.6vw,24px)]">
      <LedWordmark
        text={hero.firstLine}
        label={hero.firstLine}
        cellInset={SOLID_CELL_INSET}
        className="block h-[clamp(64px,15vw,250px)] w-auto max-w-full fill-accent"
      />
      <LedWordmark
        text={hero.secondLine}
        label={hero.secondLine}
        cellInset={DOTTED_CELL_INSET}
        className="block h-[clamp(48px,11vw,190px)] w-auto max-w-full self-end fill-foreground max-[640px]:self-start"
      />
    </h1>
  );
}

function HeroIntro({ division }: Readonly<{ division: string }>) {
  return (
    <p className="m-0 max-w-[30ch] type-wide text-[clamp(18px,2.2vw,32px)] leading-[1.15] tracking-[-.02em]">
      <Chip className="mr-3 inline-flex translate-y-[-.2em] gap-2 rounded-none bg-accent px-2.5 py-1 align-middle font-mono text-[11px] font-medium tracking-[.08em] text-black">
        <PixelMark />
        {hero.badge}
      </Chip>
      {hero.intro(division)}
    </p>
  );
}
