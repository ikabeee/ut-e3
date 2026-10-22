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
  "inline-flex h-[63px] w-full max-w-[260px] items-center rounded-full text-lg capitalize outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus";

// Marcos punteados del Figma (1:69 y 1:71): 457x367, trazo de 4 px, rayas de 25 px, a un 20 % de negro.
// Se anclan a los bordes de la imagen y el contenedor de la portada los recorta con el viewport.
const FRAME = "absolute top-[130px] hidden h-[367px] w-[457px] text-foreground/20 md:block";

function DashedFrame({ className }: Readonly<{ className: string }>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 457 367" className={`${FRAME} ${className}`}>
      <rect
        x="2"
        y="2"
        width="453"
        height="363"
        rx="23.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="25 25"
      />
    </svg>
  );
}

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
    <div className="relative overflow-x-clip pt-[clamp(8px,5vw,75px)] text-center">
      <div className="mx-auto flex w-full max-w-[1224px] flex-col items-center px-4 md:px-6 xl:px-0">
        <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row md:items-start">
          <p className="text-[clamp(1.75rem,3vw,2.875rem)] leading-[1.1] font-bold uppercase">{kicker}</p>
          <p className="text-[clamp(1rem,1.7vw,1.625rem)] leading-[1.1] text-muted uppercase md:pt-[11px]">
            {division}
          </p>
        </div>
        <h1 className="mt-[clamp(8px,1.3vw,20px)] flex leading-none">
          <LandingWordmark size="hero" className="gap-[0.16em]" />
        </h1>
        <p className="mt-[clamp(16px,2.3vw,35px)] text-[clamp(1rem,1.45vw,1.375rem)] leading-[1.1] text-muted capitalize">
          {dateLine(dateLabel, venueLabel, admissionLabel)}
        </p>
        <div className="mt-[clamp(20px,3.6vw,54px)] flex w-full flex-col items-center justify-center gap-7 sm:flex-row">
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
            className={`${CTA} justify-center gap-4 border border-foreground`}
          >
            {addToCalendar}
            <LandingIcon name="calendar" className="size-6" />
          </a>
        </div>
      </div>
      {/* La imagen del Figma (214 a 1211 px) queda 44 px a la izquierda del centro. */}
      <div className="relative mx-auto mt-[clamp(12px,1.3vw,20px)] w-full max-w-[997px] px-4 md:-left-[2.9vw] md:px-0">
        <Image
          src="/landing/hero/hero-showcase.webp"
          alt={imageAlt}
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 997px, 100vw"
          className="relative h-auto w-full"
        />
        <DashedFrame className="-left-[401px]" />
        <DashedFrame className="-right-[525px]" />
      </div>
    </div>
  );
}
