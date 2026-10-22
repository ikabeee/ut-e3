import Image from "next/image";
import type { ScheduleEntry } from "@features/landing/lib/types";
import { LandingCountdown } from "@features/landing/components/landing-countdown";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { splitClockTime } from "@features/landing/lib/countdown";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { cn } from "@heroui/react";

interface LandingProgramProps {
  /** Programa del día; `place` es la zona de la sede donde ocurre cada renglón. */
  schedule: readonly ScheduleEntry[];
  /** Fecha del evento ya formateada (`formatMonthDayYearLabel`). */
  dateLabel: string;
  /** Enlace a Google Calendar (`EVENT_INFO.calendarUrl`). */
  calendarUrl: string;
  /** Inicio del evento en ISO 8601 (`EVENT_INFO.startsAt`). */
  startsAt: string;
}

const { title, subtitle, scheduleHeading, brand, scheduleTimeLabel } = LANDING_COPY.program;

const DASHED_FRAME =
  "pointer-events-none absolute hidden h-[367px] w-[457px] border-4 border-dashed border-border xl:block";

/** Sección "Programa" (`#program`): título, enlace al calendario, horario del día y cuenta regresiva. */
export function LandingProgram({ schedule, dateLabel, calendarUrl, startsAt }: Readonly<LandingProgramProps>) {
  return (
    <section id="program" aria-labelledby="program-title" className="relative overflow-hidden bg-background">
      <div aria-hidden="true" className={cn(DASHED_FRAME, "top-[22px] -left-[228px] rounded-br-[30px]")} />
      <div aria-hidden="true" className={cn(DASHED_FRAME, "top-[805px] -right-[151px] rounded-tl-[30px]")} />
      <div className="relative mx-auto grid max-w-[1512px] gap-10 px-4 py-16 xl:grid-cols-[minmax(0,1fr)_629px] xl:items-start xl:gap-0 xl:pt-[156px] xl:pr-[210px] xl:pb-[53px] xl:pl-[83px]">
        <div className="flex flex-col items-start xl:pt-[321px]">
          <h2
            id="program-title"
            className="max-w-[475px] text-4xl leading-tight font-bold text-wrap text-foreground uppercase sm:text-5xl xl:text-[46px] xl:leading-[60px]"
          >
            {title}
          </h2>
          <p className="mt-[23px] text-[22px] leading-7 text-foreground/73 capitalize">{subtitle}</p>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[51px] inline-flex h-[63px] w-[260px] items-center justify-center gap-5 rounded-full border border-foreground text-lg text-foreground"
          >
            <span className="capitalize">{LANDING_COPY.hero.addToCalendar}</span>
            <LandingIcon name="calendar" className="size-6" />
          </a>
        </div>
        <div className="relative w-full max-w-[629px] justify-self-end bg-[url('/landing/program/schedule-card-shape.svg')] bg-[length:100%_100%] bg-no-repeat px-5 pt-28 pb-[50px] md:px-[38px] xl:pt-[145px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 right-0 h-[249px] w-[180px] bg-[url('/landing/program/constellation.svg')] bg-contain bg-no-repeat opacity-35"
          />
          <div className="absolute top-7 right-[89px] flex items-center gap-[18px]">
            <Image src="/landing/program/utgames-mark.svg" alt="" width={65} height={70} unoptimized />
            <span className="text-[38px] leading-none font-bold text-foreground">{brand}</span>
          </div>
          <p className="relative text-xl leading-7 text-foreground/73">{dateLabel}</p>
          <h3 className="relative mt-2 text-5xl leading-none font-bold text-foreground uppercase md:text-[46px] md:leading-[60px]">
            {scheduleHeading}
          </h3>
          <ol className="relative mt-[62px] flex flex-col gap-6">
            {schedule.map((entry) => {
              const { time, period } = splitClockTime(entry.time);

              return (
                <li
                  key={`${entry.time}-${entry.title}`}
                  aria-label={scheduleTimeLabel(entry.title, entry.time, entry.place)}
                  className="grid min-h-8 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[224px_15px_minmax(0,1fr)_82px] md:gap-x-[41px]"
                >
                  <span className="col-span-2 text-lg leading-6 font-black text-foreground uppercase md:col-span-1 md:text-xl">
                    {entry.title}
                  </span>
                  <Image
                    src="/landing/program/arrow.svg"
                    alt=""
                    width={15}
                    height={6}
                    unoptimized
                    className="hidden md:block"
                  />
                  <span className="flex items-baseline gap-1 text-foreground md:pl-2">
                    <span className="text-[28px] leading-none font-extrabold tabular-nums">{time}</span>
                    <span className="text-[22px] leading-none font-bold">{period}</span>
                  </span>
                  <span className="flex min-h-8 w-[82px] items-center justify-center justify-self-end rounded-[3px] bg-landing-coral px-1 text-center text-sm leading-4 font-bold text-background">
                    {entry.place}
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
