import { EVENT_INFO, EVENT_VENUE } from "@features/event/lib/event-info";

/** Franja azul de cierre: "Entrada libre" y la fecha (`.closing`). */
export function EventClosingBanner() {
  const [firstWord, ...rest] = EVENT_INFO.admission.split(" ");

  return (
    <div className="mt-[clamp(100px,12vw,180px)] bg-accent text-background">
      <div className="page-wrap flex flex-wrap items-end justify-between gap-6 py-[clamp(32px,4vw,56px)]">
        <h2 className="type-giant text-[clamp(34px,7.4vw,112px)]!">
          {firstWord}
          <br />
          {rest.join(" ")}
        </h2>
        <span className="type-mono">
          {EVENT_INFO.dateLabel} · {EVENT_VENUE.shortName}
        </span>
      </div>
    </div>
  );
}
