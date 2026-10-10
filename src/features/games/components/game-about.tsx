import { GameDetailSection } from "@features/games/components/game-detail-section";
import { describeGame } from "@features/games/lib/game-details";
import type { Game } from "@features/games/lib/types";

interface GameAboutProps {
  game: Game;
}

export function GameAbout({ game }: Readonly<GameAboutProps>) {
  return (
    <GameDetailSection title="Acerca del juego">
      <div>
        {describeGame(game).map((paragraph) => (
          <p key={paragraph} className="m-0 max-w-[66ch] leading-normal text-copy-warm">
            {paragraph}
          </p>
        ))}
      </div>
    </GameDetailSection>
  );
}
