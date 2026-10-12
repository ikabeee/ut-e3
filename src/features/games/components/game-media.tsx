import { GameImageView, type GameImageViewProps } from "@features/games/components/game-image-view";
import type { Game } from "@features/games/lib/types";

type GameMediaProps = Omit<GameImageViewProps, "image"> & {
  game: Game;
};

/** Portada de un juego. */
export function GameMedia({ game, ...imageProps }: Readonly<GameMediaProps>) {
  return <GameImageView image={game.image} {...imageProps} />;
}
