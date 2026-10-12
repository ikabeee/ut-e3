"use client";

import type { LocatedScheduleEntry } from "@features/event/lib/types";
import { ArrowGlyph } from "@shared/components/arrow-glyph";
import { ScrambleText } from "@shared/components/scramble-text";

interface EventScheduleProps {
  /** Título de la sección: la fecha corta del evento ("27.11.26"). */
  title: string;
  /** Renglones con su zona ya validada (`resolveScheduleZones` en `home`). */
  entries: readonly LocatedScheduleEntry[];
  /** Lleva al croquis y selecciona la zona donde ocurre la actividad. */
  onLocate: (zoneId: string) => void;
}

/** Programa del día (`#schedule`): hora, actividad y enlace a su zona en el croquis. */
export function EventSchedule({ title, entries, onLocate }: Readonly<EventScheduleProps>) {
  return (
    <section id="schedule" className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">{title}</h2>
        <ul className="m-0 mt-[clamp(36px,5vw,64px)] list-none border-t border-border p-0">
          {entries.map((entry) => (
            <li
              key={`${entry.time}-${entry.title}`}
              className="group grid grid-cols-[120px_1fr_auto] items-baseline gap-gutter border-b border-border py-[18px] max-[560px]:grid-cols-[64px_1fr]"
            >
              <time className="font-mono text-[15px] font-bold text-accent tabular-nums">{entry.time}</time>
              <span className="font-wide text-[clamp(14px,1.8vw,24px)] leading-[1.05] font-bold tracking-[-.02em] uppercase group-hover:text-accent">
                {entry.title}
              </span>
              <button
                type="button"
                onClick={() => onLocate(entry.zoneId)}
                className="touch-target relative cursor-pointer border-0 link-wipe p-0 pb-[3px] text-right type-tiny text-muted max-[560px]:col-start-2 max-[560px]:text-left"
              >
                <ScrambleText text={entry.zoneTitle} /> <ArrowGlyph direction="ne" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
