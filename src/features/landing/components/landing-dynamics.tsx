import { cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { EventDynamic } from "@features/event/lib/types";
import { ArrowGlyph } from "@shared/components/arrow-glyph";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const { dynamics: COPY } = LANDING_COPY;
const CARD_SIZES = "(min-width: 640px) 28rem, 85vw";

interface LandingDynamicsProps {
  dynamics: readonly EventDynamic[];
  /** Juegos del catálogo: el sorteo pide probarlos todos. */
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
    <ul className="flex flex-col gap-1 text-lg text-copy">
      {lines.map((line) => (line ? <li key={line}>{line}</li> : null))}
    </ul>
  );
}

const RAFFLE_LOGO_ICONS = ["/landing/dynamics/raffle-logo-e.svg", "/landing/dynamics/raffle-logo-o.svg"];

function RaffleLogo() {
  return (
    <p
      role="img"
      aria-label={COPY.logoLabel}
      className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-foreground"
    >
      {COPY.logoParts.map((part, index) => (
        <span key={part} aria-hidden className="flex items-center">
          {part}
          {RAFFLE_LOGO_ICONS[index] ? (
            <Image src={RAFFLE_LOGO_ICONS[index]} alt="" width={44} height={44} className="size-9" />
          ) : null}
        </span>
      ))}
    </p>
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
        {dynamic.kind === "raffle" ? <RaffleLogo /> : null}
      </div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-bold text-foreground uppercase">{dynamic.title}</h3>
        {href ? (
          <Link
            href={href}
            aria-label={COPY.openLabel(dynamic.title)}
            className="touch-target relative size-11 shrink-0 rounded-full bg-foreground"
          >
            <ArrowGlyph direction="ne" className="absolute inset-0 grid place-items-center text-2xl text-background" />
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
        <p className="text-lg text-muted">{COPY.subtitle}</p>
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
