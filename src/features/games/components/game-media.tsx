import { GameArtwork, type GameArtworkProps } from "@features/games/components/game-artwork";
import { getCoverVisual } from "@features/games/lib/game-gallery";
import type { Game } from "@features/games/lib/types";

type GameMediaProps = Omit<GameArtworkProps, "visual" | "labels"> & {
  game: Game;
};

/** Portada de un juego: su imagen si la tiene o, si no, su arte generado. */
export function GameMedia({ game, ...artworkProps }: Readonly<GameMediaProps>) {
  return (
    <GameArtwork
      visual={getCoverVisual(game)}
      labels={{ stand: game.stand, genre: game.genre, members: game.members }}
      {...artworkProps}
    />
  );
}
