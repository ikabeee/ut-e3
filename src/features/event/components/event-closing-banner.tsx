interface EventClosingBannerProps {
  /** "Entrada libre": la primera palabra va en el primer renglón. */
  admission: string;
  dateLabel: string;
  venueShortName: string;
}

/** Franja azul de cierre: "Entrada libre" y la fecha (`.closing`). */
export function EventClosingBanner({ admission, dateLabel, venueShortName }: Readonly<EventClosingBannerProps>) {
  const [firstWord, ...rest] = admission.split(" ");

  return (
    <div className="mt-[clamp(100px,12vw,180px)] bg-accent text-background">
      <div className="page-wrap flex flex-wrap items-end justify-between gap-6 py-[clamp(32px,4vw,56px)]">
        <h2 className="type-giant text-[clamp(34px,7.4vw,112px)]!">
          {firstWord}
          <br />
          {rest.join(" ")}
        </h2>
        <span className="type-mono">
          {dateLabel} · {venueShortName}
        </span>
      </div>
    </div>
  );
}
