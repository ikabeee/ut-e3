import type { ReactNode } from "react";
import type { StandOccupant } from "@features/floor-plan/lib/types";
import type { Game } from "@features/games/lib/types";

/**
 * Juego -> ocupante de su stand en el croquis. Es el único punto donde `games` se traduce al
 * vocabulario de `floor-plan` (capa anticorrupción): el croquis nunca recibe un `Game`.
 *
 * `cover` es la portada que muestra el panel del croquis; la crea la page con `GameMedia`
 * porque `lib/` no pinta componentes.
 */
export function toStandOccupant(game: Game, cover: ReactNode): StandOccupant {
  return {
    stand: game.stand,
    title: game.name,
    subtitle: game.genre,
    description: game.description,
    cover,
  };
}
