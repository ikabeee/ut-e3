import { ArrowGlyph } from "@shared/components/arrow-glyph";
import { formatTimeOfDay } from "@shared/lib/date-time";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import { SCHEDULE_SECTION_ID } from "@features/schedule/lib/schedule-links";
import type { ScheduleItem } from "@features/schedule/lib/types";

interface ZoneLink {
  href: string;
  label: string;
}

interface EventScheduleProps {
  heading: string;
  items: ScheduleItem[];
  zoneLink: (zone: string) => ZoneLink | null;
}

export function EventSchedule({ heading, items, zoneLink }: Readonly<EventScheduleProps>) {
  return (
    <section id={SCHEDULE_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">{heading}</h2>
        {items.length === 0 ? <EmptySchedule /> : <ScheduleList items={items} zoneLink={zoneLink} />}
      </div>
    </section>
  );
}

function EmptySchedule() {
  return (
    <p className="mt-[clamp(36px,5vw,64px)] border-t border-border pt-6 type-mono text-muted">{SCHEDULE_COPY.empty}</p>
  );
}

function ScheduleList({ items, zoneLink }: Readonly<Pick<EventScheduleProps, "items" | "zoneLink">>) {
  return (
    <ul className="m-0 mt-[clamp(36px,5vw,64px)] list-none border-t border-border p-0">
      {items.map((item) => (
        <ScheduleRow key={item.id} item={item} link={item.zone === null ? null : zoneLink(item.zone)} />
      ))}
    </ul>
  );
}

function ScheduleRow({ item, link }: Readonly<{ item: ScheduleItem; link: ZoneLink | null }>) {
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
      {link && <ZoneAnchor link={link} />}
    </li>
  );
}

function ZoneAnchor({ link }: Readonly<{ link: ZoneLink }>) {
  return (
    <a
      href={link.href}
      className="touch-target relative col-start-2 link-wipe type-tiny text-muted min-[561px]:col-start-3 min-[561px]:text-right"
    >
      {link.label} <ArrowGlyph direction="ne" />
    </a>
  );
}
