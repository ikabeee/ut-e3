import type { ReactNode } from "react";
import type { StandOccupant } from "@features/floor-plan/lib/types";
import type { Game } from "@features/games/lib/types";

/**
 * Juegos -> ocupantes de los stands en el croquis. Es el único punto donde `games` se traduce al
 * vocabulario de `floor-plan` (capa anticorrupción): el croquis nunca recibe un `Game`.
 *
 * Los juegos cuyo equipo todavía no tiene stand no se dibujan. `cover` crea la portada que
 * muestra el panel del croquis; la pasa la page con `GameMedia` porque `lib/` no pinta componentes.
 */
export function toStandOccupants(games: readonly Game[], cover: (game: Game) => ReactNode): StandOccupant[] {
  return games.flatMap((game) =>
    game.stand
      ? [
          {
            stand: game.stand,
            title: game.name,
            subtitle: game.genre,
            description: game.description,
            cover: cover(game),
          },
        ]
      : [],
  );
}
