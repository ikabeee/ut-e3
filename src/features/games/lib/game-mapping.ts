import type { Game, GameImage } from "@features/games/lib/types";

/**
 * Lo que el repositorio de Prisma (`lib/server/prisma-game-repository.ts`) lee de la base para
 * armar un `Game`: el juego con su equipo (y el número de integrantes), su género principal,
 * sus plataformas y sus fotos. Se declara aquí, sin tipos de Prisma, para que el mapeo sea una
 * función pura con pruebas.
 */
export interface GameRow {
  slug: string;
  name: string;
  description: string;
  about: string | null;
  players: number;
  itchioUrl: string | null;
  team: { name: string; standCode: string | null; members: number } | null;
  genre: { name: string } | null;
  platforms: readonly { platform: { name: string } | null }[];
  images: readonly GameImageRow[];
}

export interface GameImageRow {
  imageUrl: string;
  altText: string;
  cropPosition: string | null;
  isCover: boolean;
  sortOrder: number;
}

function toGameImage(row: GameImageRow): GameImage {
  return { src: row.imageUrl, alt: row.altText, position: row.cropPosition };
}

/** "Acerca del juego" en párrafos: se separan con una línea en blanco. `null` si no tiene texto. */
export function splitParagraphs(text: string | null): string[] | null {
  const paragraphs = (text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : null;
}

/**
 * Convierte una fila en el tipo `Game` del sitio. Devuelve `null` si el juego no tiene
 * portada (no se muestra hasta que el equipo suba sus fotos) o si le falta el equipo o el
 * género.
 */
export function toGame(row: GameRow): Game | null {
  const cover = row.images.find((image) => image.isCover);

  if (!cover || !row.team || !row.genre) return null;

  const screenshots = row.images.filter((image) => !image.isCover).toSorted((a, b) => a.sortOrder - b.sortOrder);

  return {
    slug: row.slug,
    name: row.name,
    genre: row.genre.name,
    team: row.team.name,
    members: row.team.members,
    players: row.players,
    stand: row.team.standCode,
    description: row.description,
    about: splitParagraphs(row.about),
    platforms: row.platforms
      .flatMap((entry) => (entry.platform ? [entry.platform.name] : []))
      .toSorted((a, b) => a.localeCompare(b, "es")),
    itchioUrl: row.itchioUrl,
    image: toGameImage(cover),
    gallery: [cover, ...screenshots].map(toGameImage),
  };
}
