import type { EventActivity } from "@features/event/lib/types";
import { PaperCard } from "@shared/components/paper-card";

interface EventActivityCardProps {
  activity: EventActivity;
}

/** Tarjeta de torneos o sorteos con sus horarios (`.card`). */
export function EventActivityCard({ activity }: Readonly<EventActivityCardProps>) {
  return (
    <article className="flex min-w-0 flex-col">
      <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
        <span className="type-tiny">{activity.place}</span>
        <h3 className="font-wide text-[clamp(24px,2.6vw,34px)] leading-[.95] font-bold tracking-[-.03em] uppercase">
          {activity.title}
        </h3>
        <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{activity.description}</p>
        <dl className="mt-2 mb-0 grid grid-cols-3 gap-[10px] border-t border-paper-rule pt-3">
          {activity.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="font-mono text-[11px] text-muted uppercase">{fact.label}</dt>
              <dd className="m-0 mt-0.5 font-mono text-sm font-bold uppercase">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </PaperCard>
    </article>
  );
}
