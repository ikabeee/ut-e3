import type { ArtColor, Game, GameVisual } from "@features/games/lib/types";

export type GalleryShot = GameVisual & { id: string };

// Tomas extra: desplazamiento en el catálogo y fondo de cada una.
const EXTRA_SHOTS: readonly { offset: number; background: ArtColor }[] = [
  { offset: 5, background: "black" },
  { offset: 11, background: "panel" },
  { offset: 3, background: "black" },
];

/** Portada del juego: su imagen o, si no tiene, su arte generado. */
export function getCoverVisual(game: Game): GameVisual {
  return game.image ? { kind: "image", image: game.image } : { kind: "art", art: game.art };
}

/**
 * Galería del detalle: la portada del juego y tres tomas generadas con otras composiciones
 * del mismo color (igual que el diseño). `totalGames` es el tamaño del catálogo.
 */
export function getGalleryShots(game: Game, totalGames: number): GalleryShot[] {
  const extras = EXTRA_SHOTS.map(
    ({ offset, background }, index): GalleryShot => ({
      id: `shot-${index + 1}`,
      kind: "art",
      art: {
        seed: ((game.art.seed + offset) % totalGames) + game.art.seed,
        palette: [game.art.palette[0], background],
      },
    }),
  );

  return [{ id: "cover", ...getCoverVisual(game) }, ...extras];
}
