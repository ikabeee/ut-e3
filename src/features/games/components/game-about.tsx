import { GameDetailSection } from "@features/games/components/game-detail-section";
import { GAMES_COPY } from "@features/games/lib/games-copy";

interface GameAboutProps {
  /** Párrafos de "Acerca del juego" (`describeGame`). */
  paragraphs: readonly string[];
}

export function GameAbout({ paragraphs }: Readonly<GameAboutProps>) {
  return (
    <GameDetailSection title={GAMES_COPY.detail.aboutHeading}>
      <div>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="m-0 max-w-[66ch] leading-normal text-copy-warm">
            {paragraph}
          </p>
        ))}
      </div>
    </GameDetailSection>
  );
}
