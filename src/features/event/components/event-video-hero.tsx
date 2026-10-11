import { EventReel } from "@features/event/components/event-reel";
import { HeroCtaLink } from "@features/event/components/hero-cta-link";
import type { EventHero, EventInfo, EventReelMedia } from "@features/event/lib/types";
import { UtgLogo } from "@shared/components/utg-logo";

interface EventVideoHeroProps {
  hero: EventHero;
  info: Pick<EventInfo, "dateLabel" | "admission" | "calendarUrl">;
  venueShortName: string;
  /** Descripción con el número real de juegos (`describeShowcase`). */
  description: string;
  reel: EventReelMedia;
}

/** Portada: fecha, logo, título, descripción y llamado a participar sobre el reel. */
export function EventVideoHero({ hero, info, venueShortName, description, reel }: Readonly<EventVideoHeroProps>) {
  return (
    <EventReel reel={reel} reelLabel={hero.reelLabel}>
      <div className="page-wrap flex w-full flex-col items-start gap-[clamp(14px,1.8vw,22px)] pb-[clamp(72px,9vw,120px)]">
        <p className="m-0 font-mono text-xs font-medium tracking-[.08em] text-copy-strong uppercase">
          {info.dateLabel} · {venueShortName} · {info.admission}
        </p>
        <h1 className="m-0 flex flex-col gap-[clamp(8px,1vw,14px)]">
          <UtgLogo variant="flat" label="UTG" className="block h-auto w-[clamp(220px,34vw,520px)]" />
          <span className="font-wide text-[clamp(18px,2.6vw,38px)] leading-none font-bold tracking-[-.03em] uppercase">
            {hero.title}
          </span>
        </h1>
        <p className="m-0 max-w-[52ch] text-[clamp(15px,1.3vw,18px)] leading-[1.45] text-copy">{description}</p>
        <div className="flex flex-wrap items-stretch gap-[10px] max-[640px]:self-stretch">
          <HeroCtaLink href={info.calendarUrl}>{hero.callToAction}</HeroCtaLink>
        </div>
      </div>
    </EventReel>
  );
}
