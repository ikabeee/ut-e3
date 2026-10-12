import { EventActivityCard } from "@features/event/components/event-activity-card";
import type { EventActivity, EventIntro } from "@features/event/lib/types";

interface EventIntroSectionProps {
  intro: EventIntro;
  activities: readonly EventActivity[];
}

/** "Juegos hechos en la UT Cancún": presentación y tarjetas de torneos y sorteos (`#event`). */
export function EventIntroSection({ intro, activities }: Readonly<EventIntroSectionProps>) {
  const [firstLine, secondLine] = intro.title;

  return (
    <section id="event" className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">
          {firstLine}
          <br />
          {secondLine}
        </h2>
        <div className="mt-9 grid grid-cols-2 items-end gap-gutter max-[820px]:grid-cols-1">
          <p className="type-mono m-0 max-w-[46ch]">{intro.lead}</p>
          <p className="type-mono m-0 max-w-[46ch] text-muted">{intro.details}</p>
        </div>
        <div className="mt-[clamp(48px,6vw,80px)] grid grid-cols-2 gap-gutter max-[820px]:grid-cols-1">
          {activities.map((activity) => (
            <EventActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </section>
  );
}
