import { cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { EventDynamic } from "@features/event/lib/types";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const { dynamics: COPY } = LANDING_COPY;
const CARD_SIZES = "(min-width: 640px) 28rem, 85vw";

interface LandingDynamicsProps {
  dynamics: readonly EventDynamic[];
  /** Juegos del evento: el sorteo pide probarlos todos. */
  gamesCount: number;
  /** Enlace de cada tarjeta por `id`; sin entrada, la tarjeta no lleva enlace. */
  hrefs?: Readonly<Record<string, string>>;
}

function DynamicMeta({ dynamic, gamesCount }: Readonly<{ dynamic: EventDynamic; gamesCount: number }>) {
  const lines =
    dynamic.kind === "raffle"
      ? [COPY.raffleRequirement(gamesCount), dynamic.prize]
      : [dynamic.format, dynamic.players === undefined ? undefined : COPY.playersLabel(dynamic.players), dynamic.prize];

  return (
    <ul className="flex flex-col gap-1 text-xl text-foreground/73 capitalize">
      {lines.map((line) => (line ? <li key={line}>{line}</li> : null))}
    </ul>
  );
}

function DynamicCard({
  dynamic,
  gamesCount,
  href,
}: Readonly<{ dynamic: EventDynamic; gamesCount: number; href?: string }>) {
  return (
    <li className="flex w-[85%] shrink-0 snap-start flex-col gap-4 sm:w-[28rem]">
      <div className="relative aspect-[606/416] overflow-hidden rounded-3xl bg-surface">
        {dynamic.backgroundImage ? (
          <Image src={dynamic.backgroundImage} alt="" fill sizes={CARD_SIZES} className="object-cover" />
        ) : null}
        {dynamic.layers?.map((layer) => (
          <div key={layer.src} className={cn("absolute", layer.className)}>
            <Image src={layer.src} alt="" fill sizes={CARD_SIZES} className="object-contain" />
          </div>
        ))}
        {dynamic.kind === "raffle" ? (
          <div className="absolute inset-0 grid place-items-center text-foreground">
            <LandingWordmark size="card" />
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-4xl font-bold text-foreground uppercase">{dynamic.title}</h3>
        {href ? (
          <Link
            href={href}
            aria-label={COPY.openLabel(dynamic.title)}
            className="touch-target relative grid size-[60px] shrink-0 place-items-center rounded-full bg-landing-band text-background"
          >
            <LandingIcon name="arrow-up-right" className="size-[27%]" />
          </Link>
        ) : null}
      </div>
      <DynamicMeta dynamic={dynamic} gamesCount={gamesCount} />
    </li>
  );
}

/** Torneos y sorteo: fila horizontal con scroll-snap, una tarjeta por dinámica. */
export function LandingDynamics({ dynamics, gamesCount, hrefs = {} }: Readonly<LandingDynamicsProps>) {
  return (
    <div className="page-wrap flex flex-col gap-8 py-12">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-foreground uppercase sm:text-5xl">{COPY.title}</h2>
        <p className="text-xl text-foreground/73 capitalize">{COPY.subtitle}</p>
      </header>
      <ul
        aria-label={COPY.listAriaLabel}
        className="-mx-4 scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto px-4"
      >
        {dynamics.map((dynamic) => (
          <DynamicCard key={dynamic.id} dynamic={dynamic} gamesCount={gamesCount} href={hrefs[dynamic.id]} />
        ))}
      </ul>
    </div>
  );
}
