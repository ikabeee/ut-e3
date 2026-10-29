import { GAMES_COPY } from "@features/games/lib/games-copy";
import { formatStandCode, type StandLocation } from "@features/games/lib/stand-code";
import type { GameEventLabels } from "@features/games/lib/types";

const HEADING_ID = "play-location-heading";

interface GamePlayLocationProps {
  stand: StandLocation;
  event: GameEventLabels;
}

export function GamePlayLocation({ stand, event }: Readonly<GamePlayLocationProps>) {
  const { playLocation, labels } = GAMES_COPY;

  const cells = [
    { label: labels.stand, value: formatStandCode(stand) },
    { label: labels.zone, value: stand.zone },
    { label: labels.date, value: event.dateLabel },
    { label: labels.hours, value: event.hoursLabel },
  ];

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-4">
      <h2 id={HEADING_ID} className="type-section">
        {playLocation.heading}
      </h2>
      <dl className="grid grid-cols-2 gap-px border border-border bg-border min-[560px]:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1 bg-background p-3.5">
            <dt className="type-tiny text-muted">{cell.label}</dt>
            <dd className="font-mono text-[15px] font-bold">{cell.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
