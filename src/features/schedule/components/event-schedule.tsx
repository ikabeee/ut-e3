import { formatTimeOfDay } from "@shared/lib/date-time";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import { SCHEDULE_SECTION_ID } from "@features/schedule/lib/schedule-links";
import type { ScheduleItem } from "@features/schedule/lib/types";

interface EventScheduleProps {
  heading: string;
  items: ScheduleItem[];
  /** The name of the place of a zone, shown as plain text; `null` for a zone with no name. */
  zoneLabel: (zone: string) => string | null;
}

export function EventSchedule({ heading, items, zoneLabel }: Readonly<EventScheduleProps>) {
  return (
    <section id={SCHEDULE_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant text-[clamp(24px,4.6vw,68px)]">{heading}</h2>
        {items.length === 0 ? <EmptySchedule /> : <ScheduleList items={items} zoneLabel={zoneLabel} />}
      </div>
    </section>
  );
}

function EmptySchedule() {
  return (
    <p className="mt-[clamp(36px,5vw,64px)] border-t border-border pt-6 type-mono text-muted">{SCHEDULE_COPY.empty}</p>
  );
}

function ScheduleList({ items, zoneLabel }: Readonly<Pick<EventScheduleProps, "items" | "zoneLabel">>) {
  return (
    <ul className="m-0 mt-[clamp(36px,5vw,64px)] list-none border-t border-border p-0">
      {items.map((item) => (
        <ScheduleRow key={item.id} item={item} place={item.zone === null ? null : zoneLabel(item.zone)} />
      ))}
    </ul>
  );
}

function ScheduleRow({ item, place }: Readonly<{ item: ScheduleItem; place: string | null }>) {
  return (
    <li className="group grid grid-cols-[64px_1fr] items-baseline gap-x-(--gutter) gap-y-3 border-b border-border py-[18px] min-[561px]:grid-cols-[120px_1fr_auto]">
      <time dateTime={item.startsAt} className="font-mono text-[15px] font-bold text-accent tabular-nums">
        {formatTimeOfDay(item.startsAt)}
      </time>
      <div>
        <h3 className="type-wide text-[clamp(14px,1.8vw,24px)] leading-[1.05] tracking-[-.02em] group-hover:text-accent">
          {item.title}
        </h3>
        <p className="mt-2 text-sm text-muted">{item.description}</p>
      </div>
      {place && (
        <p className="col-start-2 m-0 type-tiny text-muted min-[561px]:col-start-3 min-[561px]:text-right">{place}</p>
      )}
    </li>
  );
}
