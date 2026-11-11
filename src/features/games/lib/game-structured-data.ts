import { getGamePath } from "@features/games/lib/game-links";
import type { Game } from "@features/games/lib/types";

/** Datos estructurados (schema.org/VideoGame) del detalle de un juego. */
export function buildGameStructuredData(game: Game, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.description,
    genre: game.genre,
    url: new URL(getGamePath(game.slug), siteUrl).toString(),
    ...(game.image ? { image: new URL(game.image.src, siteUrl).toString() } : {}),
    author: { "@type": "Organization", name: game.team },
    publisher: { "@type": "CollegeOrUniversity", name: "Universidad Tecnológica de Cancún" },
  };
}
