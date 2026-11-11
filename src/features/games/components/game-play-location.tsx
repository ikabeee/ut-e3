import { GameDetailSection } from "@features/games/components/game-detail-section";
import { getStandAisle } from "@features/games/lib/game-details";
import type { Game } from "@features/games/lib/types";

interface GamePlayLocationProps {
  game: Game;
  eventDateLabel: string;
  eventHoursLabel: string;
}

/** "Dónde jugarlo": stand, pasillo, fecha y horario (`.where`). */
export function GamePlayLocation({ game, eventDateLabel, eventHoursLabel }: Readonly<GamePlayLocationProps>) {
  const cells = [
    { label: "Stand", value: game.stand },
    { label: "Pasillo", value: getStandAisle(game.stand) },
    { label: "Fecha", value: eventDateLabel },
    { label: "Horario", value: eventHoursLabel },
  ];

  return (
    <GameDetailSection title="Dónde jugarlo">
      <div className="grid grid-cols-4 gap-px border border-border bg-border max-[560px]:grid-cols-2">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1 bg-background p-[14px]">
            <span className="type-tiny text-muted">{cell.label}</span>
            <b className="font-mono text-[15px]">{cell.value}</b>
          </div>
        ))}
      </div>
    </GameDetailSection>
  );
}
