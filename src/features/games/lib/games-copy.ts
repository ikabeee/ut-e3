import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

export const GAMES_COPY = {
  carousel: {
    roleDescription: "carrusel",
    slideRoleDescription: "diapositiva",
    label: "Juegos del showcase",
    previous: "Juego anterior",
    next: "Juego siguiente",
  },
  catalog: {
    heading: "Explora el catálogo",
  },
  coverflow: {
    label: "Juegos en el exhibidor",
    caseLabel: (game: Pick<Game, "name" | "genre" | "stand">) =>
      `${game.name}, ${game.genre.name}, stand ${formatStandCode(game.stand)}`,
    position: (current: number, count: number) => `${padTwoDigits(current + 1)} de ${padTwoDigits(count)}`,
  },
};

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
