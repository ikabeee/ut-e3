import { ScheduleItemDelete } from "@features/schedule/components/schedule-item-delete";
import { ScheduleItemForm, type ScheduleAction } from "@features/schedule/components/schedule-item-form";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import type { ScheduleItem, ZoneOption } from "@features/schedule/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface ScheduleAdminProps {
  items: readonly ScheduleItem[];
  zones: readonly ZoneOption[];
  saveAction: ScheduleAction;
  deleteAction: ScheduleAction;
}

const COPY = SCHEDULE_COPY.admin;

export function ScheduleAdmin({ items, zones, saveAction, deleteAction }: Readonly<ScheduleAdminProps>) {
  return (
    <section aria-labelledby="schedule-admin-heading" className="grid gap-8">
      <h2 id="schedule-admin-heading" className="type-section">
        {COPY.heading}
      </h2>
      <details className="border border-border p-4">
        <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.newItem}</summary>
        <div className="pt-4">
          <ScheduleItemForm zones={zones} action={saveAction} />
        </div>
      </details>
      {items.length === 0 ? (
        <p className="type-mono text-muted">{SCHEDULE_COPY.empty}</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((item) => (
            <ScheduleAdminRow
              key={item.id}
              item={item}
              zones={zones}
              saveAction={saveAction}
              deleteAction={deleteAction}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ScheduleAdminRow({
  item,
  zones,
  saveAction,
  deleteAction,
}: Readonly<Omit<ScheduleAdminProps, "items"> & { item: ScheduleItem }>) {
  const zoneLabel = zones.find((zone) => zone.id === item.zone)?.label ?? COPY.noZone;

  return (
    <li>
      <details className="border border-border p-4">
        <summary className="grid min-h-11 cursor-pointer grid-cols-[56px_1fr] items-baseline gap-x-3">
          <time dateTime={item.startsAt} className="font-mono font-bold text-accent tabular-nums">
            {formatTimeOfDay(item.startsAt)}
          </time>
          <span>
            {item.title}
            <span className="block type-tiny text-muted">{zoneLabel}</span>
          </span>
        </summary>
        <div className="grid gap-6 pt-4">
          <ScheduleItemForm item={item} zones={zones} action={saveAction} />
          <ScheduleItemDelete itemId={item.id} itemTitle={item.title} action={deleteAction} />
        </div>
      </details>
    </li>
  );
}
