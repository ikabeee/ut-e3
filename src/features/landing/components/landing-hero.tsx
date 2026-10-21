import Image from "next/image";
import Link from "next/link";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingHeroProps {
  dateLabel: string;
  venueLabel: string;
  admissionLabel: string;
  gamesHref: string;
  calendarUrl: string;
}

const CTA =
  "inline-flex h-[63px] w-full max-w-[260px] items-center rounded-full text-xl capitalize outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus";

/** Cabecera de la portada: título, datos del evento, llamadas a la acción e imagen. */
export function LandingHero({
  dateLabel,
  venueLabel,
  admissionLabel,
  gamesHref,
  calendarUrl,
}: Readonly<LandingHeroProps>) {
  const { kicker, division, dateLine, imageAlt, viewGames, addToCalendar } = LANDING_COPY.hero;

  return (
    <div className="page-wrap flex flex-col items-center gap-6 pt-10 text-center">
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
        <p className="text-[clamp(1.75rem,3vw,2.875rem)] leading-none font-bold uppercase">{kicker}</p>
        <p className="text-[clamp(1rem,1.6vw,1.5rem)] text-foreground/64 uppercase">{division}</p>
      </div>
      <h1>
        <LandingWordmark size="hero" />
      </h1>
      <p className="text-xl text-foreground/64 capitalize">{dateLine(dateLabel, venueLabel, admissionLabel)}</p>
      <div className="flex w-full flex-col items-center justify-center gap-7 sm:flex-row">
        <Link href={gamesHref} className={`${CTA} gap-7 border border-foreground/20 bg-accent pl-2 text-foreground`}>
          <span className="grid size-[55px] place-items-center rounded-full bg-foreground text-background">
            <LandingIcon name="gamepad" className="size-6" />
          </span>
          {viewGames}
        </Link>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CTA} justify-center gap-5 border border-foreground`}
        >
          {addToCalendar}
          <LandingIcon name="calendar" className="size-6" />
        </a>
      </div>
      <div className="relative w-full max-w-[997px] px-4 md:px-0">
        <span
          aria-hidden="true"
          className="absolute top-1/4 -left-4 hidden h-1/2 w-24 rounded-r-3xl border-2 border-l-0 border-dashed border-border md:block"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/4 -right-4 hidden h-1/2 w-24 rounded-l-3xl border-2 border-r-0 border-dashed border-border md:block"
        />
        <Image
          src="/landing/hero/hero-showcase.webp"
          alt={imageAlt}
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 997px, 100vw"
          className="relative h-auto w-full"
        />
      </div>
    </div>
  );
}
