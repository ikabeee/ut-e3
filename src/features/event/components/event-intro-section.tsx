import { EventActivityCard } from "@features/event/components/event-activity-card";
import { EVENT_ACTIVITIES, EVENT_INTRO } from "@features/event/lib/event-program";

/** "Juegos hechos en la UT Cancún": presentación y tarjetas de torneos y sorteos (`#evento`). */
export function EventIntroSection() {
  const [firstLine, secondLine] = EVENT_INTRO.title;

  return (
    <section id="evento" className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">
          {firstLine}
          <br />
          {secondLine}
        </h2>
        <div className="mt-9 grid grid-cols-2 items-end gap-gutter max-[820px]:grid-cols-1">
          <p className="type-mono m-0 max-w-[46ch]">{EVENT_INTRO.lead}</p>
          <p className="type-mono m-0 max-w-[46ch] text-muted">{EVENT_INTRO.details}</p>
        </div>
        <div className="mt-[clamp(48px,6vw,80px)] grid grid-cols-2 gap-gutter max-[820px]:grid-cols-1">
          {EVENT_ACTIVITIES.map((activity) => (
            <EventActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </section>
  );
}
