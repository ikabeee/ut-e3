"use client";

import { useCountdown } from "@features/landing/hooks/use-countdown";
import { padCountdownValue, type CountdownParts } from "@features/landing/lib/countdown";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingCountdownProps {
  /** Inicio del evento en ISO 8601 (`EVENT_INFO.startsAt`). */
  startsAt: string;
}

const { countdownLabel, units, countdownSummary } = LANDING_COPY.program;

const UNIT_KEYS = ["days", "hours", "minutes", "seconds"] as const satisfies readonly (keyof CountdownParts)[];

/** Cuenta regresiva al inicio. Antes de montar muestra "--", así el prerender no depende de la hora. */
export function LandingCountdown({ startsAt }: Readonly<LandingCountdownProps>) {
  const parts = useCountdown(startsAt);

  return (
    <section aria-label={countdownLabel} className="flex flex-col gap-3">
      <div className="grid grid-cols-4 divide-x divide-border border border-border bg-background/95">
        {UNIT_KEYS.map((unit) => (
          <div key={unit} className="flex flex-col items-center gap-1 px-1 py-4 sm:py-6">
            <span aria-hidden="true" className="text-3xl font-extrabold text-danger tabular-nums sm:text-5xl">
              {parts ? padCountdownValue(parts[unit]) : "--"}
            </span>
            <span className="text-[0.6875rem] font-semibold tracking-wider text-muted uppercase">{units[unit]}</span>
          </div>
        ))}
      </div>
      <p className="text-xl text-foreground/75">{countdownLabel}</p>
      {/* Los números cambian cada segundo y quedan ocultos; el resumen sólo cambia cada minuto. */}
      <p role="status" className="sr-only">
        {parts ? countdownSummary(parts.days, parts.hours, parts.minutes) : null}
      </p>
    </section>
  );
}
