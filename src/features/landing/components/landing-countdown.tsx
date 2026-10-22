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
    <section aria-label={countdownLabel} className="relative mt-8 -mr-1.5 -ml-3 flex flex-col gap-[23px]">
      <div className="grid h-[119px] grid-cols-4 divide-x divide-slate-200 border border-slate-200 bg-background">
        {UNIT_KEYS.map((unit) => (
          <div key={unit} className="flex flex-col items-center justify-center gap-1">
            <span
              aria-hidden="true"
              className="text-4xl leading-none font-extrabold text-landing-coral tabular-nums sm:text-[45px]"
            >
              {parts ? padCountdownValue(parts[unit]) : "--"}
            </span>
            <span className="text-[11px] leading-none font-medium tracking-wider text-slate-500 uppercase">
              {units[unit]}
            </span>
          </div>
        ))}
      </div>
      <p className="pl-[5px] text-xl leading-7 text-foreground/73 capitalize">{countdownLabel}</p>
      {/* Los números cambian cada segundo y quedan ocultos; el resumen sólo cambia cada minuto. */}
      <p role="status" className="sr-only">
        {parts ? countdownSummary(parts.days, parts.hours, parts.minutes) : null}
      </p>
    </section>
  );
}
