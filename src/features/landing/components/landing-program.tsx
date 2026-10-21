import Image from "next/image";
import type { LocatedScheduleEntry } from "@features/event/lib/types";
import { LandingCountdown } from "@features/landing/components/landing-countdown";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { splitClockTime } from "@features/landing/lib/countdown";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { cn } from "@heroui/react";

interface LandingProgramProps {
  /** Programa del día; `zoneTitle` es la zona del croquis donde ocurre cada renglón. */
  schedule: readonly LocatedScheduleEntry[];
  /** Fecha del evento ya formateada (`EVENT_INFO.dateLabel`). */
  dateLabel: string;
  /** Enlace a Google Calendar (`EVENT_INFO.calendarUrl`). */
  calendarUrl: string;
  /** Inicio del evento en ISO 8601 (`EVENT_INFO.startsAt`). */
  startsAt: string;
}

const { title, subtitle, scheduleHeading, brand, scheduleTimeLabel } = LANDING_COPY.program;

const DASHED_FRAME = "pointer-events-none absolute hidden border-4 border-dashed border-foreground/10 lg:block";

/** Sección "Programa" (`#program`): título, enlace al calendario, horario del día y cuenta regresiva. */
export function LandingProgram({ schedule, dateLabel, calendarUrl, startsAt }: Readonly<LandingProgramProps>) {
  return (
    <section id="program" aria-labelledby="program-title" className="relative overflow-hidden bg-background">
      <div aria-hidden="true" className={cn(DASHED_FRAME, "top-16 -left-8 h-72 w-56 rounded-[1.6rem]")} />
      <div aria-hidden="true" className={cn(DASHED_FRAME, "right-0 bottom-16 h-72 w-56 rounded-[1.6rem]")} />
      <div className="relative page-wrap grid gap-10 py-16 lg:grid-cols-[1fr_minmax(0,40rem)] lg:items-start lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h2
            id="program-title"
            className="text-4xl leading-tight font-bold text-foreground uppercase sm:text-5xl lg:text-6xl"
          >
            {title}
          </h2>
          <p className="text-xl text-foreground/73">{subtitle}</p>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex min-h-11 items-center gap-4 rounded-full border border-foreground px-8 py-3 text-lg text-foreground"
          >
            <span className="capitalize">{LANDING_COPY.hero.addToCalendar}</span>
            <LandingIcon name="calendar" className="size-6" />
          </a>
        </div>
        <div className="relative flex flex-col gap-8 bg-[url('/landing/program/schedule-card-shape.svg')] bg-[length:100%_100%] bg-no-repeat px-5 pt-24 pb-8 sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-24 right-0 h-60 w-44 bg-[url('/landing/program/constellation.svg')] bg-contain bg-no-repeat opacity-35"
          />
          <div className="absolute top-6 right-6 left-6 flex items-center justify-end gap-3 sm:right-10">
            <Image src="/landing/program/utgames-mark.svg" alt="" width={58} height={67} unoptimized />
            <span className="text-3xl font-bold text-foreground">{brand}</span>
          </div>
          <div className="relative flex flex-col gap-1">
            <p className="text-xl text-foreground/73">{dateLabel}</p>
            <h3 className="text-4xl font-bold text-foreground uppercase sm:text-5xl">{scheduleHeading}</h3>
          </div>
          <ol className="relative flex flex-col gap-4">
            {schedule.map((entry) => {
              const { time, period } = splitClockTime(entry.time);

              return (
                <li
                  key={`${entry.time}-${entry.title}`}
                  aria-label={scheduleTimeLabel(entry.title, entry.time, entry.zoneTitle)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:justify-between"
                >
                  <span className="basis-full text-lg font-black text-foreground uppercase sm:basis-56 sm:text-2xl">
                    {entry.title}
                  </span>
                  <Image
                    src="/landing/program/arrow.svg"
                    alt=""
                    width={15}
                    height={6}
                    unoptimized
                    className="hidden sm:block"
                  />
                  <span className="flex items-baseline gap-2 text-foreground">
                    <span className="text-3xl font-black tabular-nums">{time}</span>
                    <span className="text-xl font-bold">{period}</span>
                  </span>
                  <span className="rounded bg-landing-coral px-3 py-1 text-sm font-black text-background">
                    {entry.zoneTitle}
                  </span>
                </li>
              );
            })}
          </ol>
          <LandingCountdown startsAt={startsAt} />
        </div>
      </div>
    </section>
  );
}
