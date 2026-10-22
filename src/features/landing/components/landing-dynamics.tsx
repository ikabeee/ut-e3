import { cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { EventDynamic } from "@features/landing/lib/types";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const { dynamics: COPY } = LANDING_COPY;
const CARD_SIZES = "(min-width: 640px) 40vw, 85vw";
const ARROW_CLASS =
  "absolute top-1 right-0 grid size-[clamp(3.5rem,5.3vw,5rem)] place-items-center rounded-full bg-landing-band text-background";

interface LandingDynamicsProps {
  dynamics: readonly EventDynamic[];
  /** Juegos del evento: el sorteo pide probarlos todos. */
  gamesCount: number;
  /** Enlace de cada tarjeta por `id`; sin entrada, la flecha es sólo decorativa. */
  hrefs?: Readonly<Record<string, string>>;
}

function DynamicMeta({ dynamic, gamesCount }: Readonly<{ dynamic: EventDynamic; gamesCount: number }>) {
  const details =
    dynamic.kind === "raffle"
      ? [COPY.raffleRequirement(gamesCount)]
      : [dynamic.format, dynamic.players === undefined ? undefined : COPY.playersLabel(dynamic.players)];

  return (
    <ul className="flex flex-col gap-5 pl-1.5 text-[clamp(1.125rem,1.6vw,1.5rem)] leading-[1.25] text-foreground capitalize">
      <li>
        <ul className="flex flex-wrap gap-x-12">
          {details.map((detail) => (detail ? <li key={detail}>{detail}</li> : null))}
        </ul>
      </li>
      <li>{dynamic.prize}</li>
    </ul>
  );
}

function DynamicArrow({ title, href }: Readonly<{ title: string; href?: string }>) {
  const icon = <LandingIcon name="arrow-up-right" className="size-[33%]" />;

  if (!href) {
    return (
      <span aria-hidden="true" className={ARROW_CLASS}>
        {icon}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={COPY.openLabel(title)} className={cn("touch-target", ARROW_CLASS)}>
      {icon}
    </Link>
  );
}

function DynamicCard({
  dynamic,
  gamesCount,
  href,
}: Readonly<{ dynamic: EventDynamic; gamesCount: number; href?: string }>) {
  return (
    <li className="relative flex w-[85vw] shrink-0 snap-start flex-col gap-6 sm:w-[40.08vw]">
      <div
        className={cn("relative aspect-[606/416] overflow-hidden rounded-[25.6px] bg-surface", dynamic.cardClassName)}
      >
        {dynamic.backgroundImage ? (
          <Image src={dynamic.backgroundImage} alt="" fill sizes={CARD_SIZES} className="object-cover" />
        ) : null}
        {dynamic.layers?.map((layer) => (
          <div key={layer.src} className={cn("absolute", layer.className)}>
            <Image
              src={layer.src}
              alt=""
              fill
              sizes={CARD_SIZES}
              className={cn("object-cover object-top", layer.imageClassName)}
            />
          </div>
        ))}
        {dynamic.kind === "raffle" ? (
          <div className="absolute inset-0 grid place-items-center text-foreground">
            <LandingWordmark size="card" />
          </div>
        ) : null}
      </div>
      <div className="relative">
        <h3 className="pr-24 text-[clamp(1.5rem,2.12vw,2rem)] leading-tight font-bold text-foreground uppercase">
          {dynamic.title}
        </h3>
        <DynamicArrow title={dynamic.title} href={href} />
      </div>
      <DynamicMeta dynamic={dynamic} gamesCount={gamesCount} />
    </li>
  );
}

/** Torneos y sorteo: fila horizontal con scroll-snap, una tarjeta por dinámica. */
export function LandingDynamics({ dynamics, gamesCount, hrefs = {} }: Readonly<LandingDynamicsProps>) {
  return (
    <div className="flex flex-col gap-[clamp(2rem,4.3vw,4rem)] pt-9 pb-8 md:pt-[min(10.38vw,157px)]">
      <header className="flex flex-col gap-8 pl-[max(var(--gutter),5.03vw)]">
        <h2 className="text-[clamp(1.75rem,3.04vw,2.875rem)] leading-none font-bold text-foreground uppercase">
          {COPY.title}
        </h2>
        <p className="pl-1.5 text-[clamp(1rem,1.36vw,1.25rem)] text-muted capitalize">{COPY.subtitle}</p>
      </header>
      <ul
        aria-label={COPY.listAriaLabel}
        className="scrollbar-none flex snap-x snap-mandatory scroll-pl-[max(var(--gutter),5.03vw)] gap-6 overflow-x-auto pr-[max(var(--gutter),5.03vw)] pb-4 pl-[max(var(--gutter),5.03vw)] sm:gap-[3.57vw]"
      >
        {dynamics.map((dynamic) => (
          <DynamicCard key={dynamic.id} dynamic={dynamic} gamesCount={gamesCount} href={hrefs[dynamic.id]} />
        ))}
      </ul>
    </div>
  );
}
