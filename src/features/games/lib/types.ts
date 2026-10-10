/** Colores de la paleta del diseño que puede usar el arte generado de un juego. */
export type ArtColor = "acid" | "black" | "white" | "panel" | "light";

/**
 * Arte generado (canvas) que se muestra cuando un juego todavía no tiene imagen,
 * y en las tomas extra de su galería.
 */
export interface GameKeyArt {
  /** Semilla que decide la composición y el ruido del arte. */
  seed: number;
  /** `[color de la figura, color del fondo]`. */
  palette: readonly [ArtColor, ArtColor];
}

export interface GameImage {
  /** Ruta pública de la imagen (por ejemplo `/mock/games/ruta-9.jpg`). */
  src: string;
  /** Encuadre CSS (`object-position`), por ejemplo `"60% 35%"`. */
  position: string;
}

/** Videojuego presentado por un equipo en su stand. */
export interface Game {
  slug: string;
  name: string;
  genre: string;
  /** Nombre del equipo, por ejemplo "Equipo Grava". */
  team: string;
  members: number;
  /** Código del stand en el croquis, por ejemplo "A1". */
  stand: string;
  hasTournament: boolean;
  description: string;
  image: GameImage | null;
  art: GameKeyArt;
}

/** Género con sus juegos, para el carrusel de géneros del catálogo. */
export interface GenreSummary {
  name: string;
  gameCount: number;
  /** Tres portadas: dos al fondo y la del frente al final. */
  covers: readonly Game[];
}
