import { getCoverImage } from "@features/games/lib/game-cover";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";

/** The stand of the floor plan that shows a game: its short code, name, genre, synopsis and cover. */
export function toFloorPlanStand(game: Game): FloorPlanStand {
  const cover = getCoverImage(game);

  return {
    code: formatStandCode(game.stand),
    name: game.name,
    genre: game.genre.name,
    synopsis: game.synopsis,
    coverSrc: cover.path,
    coverAlt: cover.alt,
  };
}
