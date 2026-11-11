"use client";

import { cn } from "@heroui/react";
import { useSpinReveal } from "@features/raffle/hooks/use-spin-reveal";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { LiveDraw, RaffleLiveSnapshot } from "@features/raffle/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface RaffleDrumProps {
  snapshot: RaffleLiveSnapshot;
}

const COPY = RAFFLE_COPY.live;

// The rolling digits stay in the range of the tickets of the event: 2 per visitor, a few hundred visitors.
const MIN_ROLLING_MAX = 99;

/** The middle of the stage screen: the spin, then the ticket number and the gamertag (RF-49). */
export function RaffleDrum({ snapshot }: Readonly<RaffleDrumProps>) {
  const { latest } = snapshot;
  const reveal = useSpinReveal(latest, { maxNumber: Math.max(MIN_ROLLING_MAX, (latest?.ticketNumber ?? 0) * 2) });

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className="grid min-h-[50svh] place-content-center gap-6 text-center"
    >
      <DrumContent snapshot={snapshot} latest={latest} isSpinning={reveal.isSpinning} rolling={reveal.rollingNumber} />
    </section>
  );
}

interface DrumContentProps extends RaffleDrumProps {
  latest: LiveDraw | null;
  isSpinning: boolean;
  rolling: number | null;
}

function DrumContent({ snapshot, latest, isSpinning, rolling }: Readonly<DrumContentProps>) {
  if (snapshot.phase === "upcoming") return <BigLine>{COPY.upcoming(formatTimeOfDay(snapshot.startsAt))}</BigLine>;

  if (snapshot.phase === "closed") return <BigLine>{COPY.closed}</BigLine>;

  if (isSpinning) return <Spinning rolling={rolling} />;

  return latest ? <Revealed draw={latest} /> : <BigLine>{COPY.waiting}</BigLine>;
}

function BigLine({ children }: Readonly<{ children: string }>) {
  return <p className="m-0 type-section text-balance">{children}</p>;
}

function Spinning({ rolling }: Readonly<{ rolling: number | null }>) {
  return (
    <>
      <p className="m-0 type-tiny text-muted">{COPY.spinning}</p>
      <p
        aria-hidden="true"
        className="m-0 animate-pulse type-mono text-[clamp(5rem,22vw,16rem)] leading-none text-accent"
      >
        {rolling === null ? "???" : `#${rolling}`}
      </p>
    </>
  );
}

function Revealed({ draw }: Readonly<{ draw: LiveDraw }>) {
  return (
    <>
      <p className="m-0 type-tiny text-muted">{COPY.ticketLabel}</p>
      <p className="m-0 animate-rise type-mono text-[clamp(5rem,22vw,16rem)] leading-none text-accent">
        #{draw.ticketNumber}
      </p>
      <p className="m-0 type-section break-all">{draw.gamertag}</p>
      <p
        className={cn(
          "m-0 justify-self-center px-4 py-2 type-wide text-xl",
          draw.outcome === "winner" && "bg-accent text-accent-foreground",
          draw.outcome === "discarded" && "border border-border text-muted",
          draw.outcome === "pending" && "text-foreground",
        )}
      >
        {COPY.outcomes[draw.outcome]}
      </p>
    </>
  );
}
