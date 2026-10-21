import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { ActionLink } from "@shared/components/action-link";

interface LandingHeroProps {
  dateLabel: string;
  venueLabel: string;
  admissionLabel: string;
  division: string;
  gamesHref: string;
  calendarUrl: string;
}

// El radio de la píldora del diseño (~53 px) reemplaza a propósito el radio 0 del tema.
const PILL = "rounded-full";
const ICON = "inline-block size-[0.8em] shrink-0 rounded-full align-middle";

/** Cabecera de la portada: título, datos del evento, llamadas a la acción e imagen. */
export function LandingHero({
  dateLabel,
  venueLabel,
  admissionLabel,
  division,
  gamesHref,
  calendarUrl,
}: Readonly<LandingHeroProps>) {
  const { kicker, title, titleParts, imageAlt, viewGames, addToCalendar } = LANDING_COPY.hero;
  const [start, middle, end] = titleParts;

  return (
    <div className="page-wrap flex flex-col items-center gap-6 pt-10 text-center">
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
        <p className="type-mono">{kicker}</p>
        <p className="type-mono text-muted">{division}</p>
      </div>
      <h1
        aria-label={title}
        className="flex flex-wrap items-center justify-center gap-x-[0.08em] text-[clamp(2.5rem,13vw,7.5rem)] leading-none font-bold"
      >
        <span aria-hidden="true">{start}</span>
        <span aria-hidden="true" className={`${ICON} relative bg-accent`}>
          <span className="absolute top-1/2 left-1/4 h-[10%] w-1/2 -translate-y-1/2 bg-foreground" />
          <span className="absolute top-1/4 left-1/2 h-1/2 w-[10%] -translate-x-1/2 bg-foreground" />
        </span>
        <span aria-hidden="true">{middle}</span>
        <span aria-hidden="true" className={`${ICON} border-[0.1em] border-danger bg-danger/20`} />
        <span aria-hidden="true">{end}</span>
      </h1>
      <p className="type-mono text-muted">{`${dateLabel} · ${venueLabel} · ${admissionLabel}`}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ActionLink href={gamesHref} variant="primary" className={PILL}>
          {viewGames}
        </ActionLink>
        <ActionLink href={calendarUrl} variant="outline" isExternal className={PILL}>
          {addToCalendar}
        </ActionLink>
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
