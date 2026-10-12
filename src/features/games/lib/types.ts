/** Foto de un juego: la portada o una captura de la galería. */
export interface GameImage {
  /** URL https:// o ruta del sitio, por ejemplo `/mock/games/ruta-9.jpg`. */
  src: string;
  /** Texto alternativo de la imagen. */
  alt: string;
  /** Encuadre CSS (`object-position`), por ejemplo `"60% 35%"`; `null` la centra. */
  position: string | null;
}

/**
 * Videojuego presentado por un equipo en su stand. El sitio sólo muestra los juegos que ya
 * tienen portada: si un equipo no ha subido sus fotos, su juego no aparece (ver
 * `docs/data-model.md`).
 */
export interface Game {
  slug: string;
  name: string;
  /** Género principal: el que agrupa el catálogo. */
  genre: string;
  /** Nombre del equipo, por ejemplo "Equipo Grava". */
  team: string;
  members: number;
  /** Jugadores por partida en la demo (1 = un jugador). */
  players: number;
  /** Código del stand en el croquis, por ejemplo "A1"; `null` mientras no se asigna. */
  stand: string | null;
  description: string;
  /** Párrafos de "Acerca del juego"; con `null` se usa el texto genérico de `games-copy.ts`. */
  about: readonly string[] | null;
  /** Plataformas en las que corre, por ejemplo `["Web (navegador)", "Windows"]`. */
  platforms: readonly string[];
  /** Página del juego en itch.io, cuando ya está publicado. */
  itchioUrl: string | null;
  /** Portada. */
  image: GameImage;
  /** Portada y capturas, en el orden de la galería. */
  gallery: readonly GameImage[];
}

/** Género con sus juegos, para el carrusel de géneros del catálogo. */
export interface GenreSummary {
  name: string;
  gameCount: number;
  /** Tres portadas: dos al fondo y la del frente al final. */
  covers: readonly Game[];
}

// ---------------------------------------------------------------------------
// Panel de administración del catálogo
// ---------------------------------------------------------------------------

/** Género o plataforma del catálogo. */
export interface CatalogOption {
  id: string;
  slug: string;
  name: string;
}

export interface CatalogOptionInput {
  slug: string;
  name: string;
}

/** Foto de un juego tal como la administra el panel. */
export interface GameImageRecord {
  id: string;
  imageUrl: string;
  altText: string;
  cropPosition: string | null;
  isCover: boolean;
  sortOrder: number;
}

export interface GameImageInput {
  imageUrl: string;
  altText: string;
  cropPosition: string | null;
  isCover: boolean;
  sortOrder: number;
}

/** Juego tal como lo administra el panel (incluye los que todavía no tienen portada). */
export interface GameRecord {
  id: string;
  teamId: string;
  genreId: string;
  slug: string;
  name: string;
  description: string;
  about: string | null;
  players: number;
  itchioUrl: string | null;
  sortOrder: number;
  extraGenreIds: string[];
  platformIds: string[];
  images: GameImageRecord[];
}

export interface GameInput {
  teamId: string;
  genreId: string;
  slug: string;
  name: string;
  description: string;
  /** "Acerca del juego": párrafos separados por una línea en blanco. */
  about: string | null;
  players: number;
  itchioUrl: string | null;
  sortOrder: number;
  /** Géneros además del principal. */
  extraGenreIds: string[];
  /** Al menos una plataforma. */
  platformIds: string[];
}
