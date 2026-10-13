import type { Game, GameImage } from "@features/games/lib/types";

/**
 * Contrato HTTP de `/api/games`: lo que viaja entre el Route Handler y el navegador.
 *
 * Es un tipo propio y no el tipo de dominio `Game`: si `Game` cambia, TypeScript obliga a
 * decidir aquí qué se publica (`toGameDto`) y cómo se lee (`parseGamesResponse`), en lugar de
 * romper el navegador en silencio.
 */
export interface GameImageDto {
  src: string;
  alt: string;
  position: string | null;
}

export interface GameDto {
  slug: string;
  name: string;
  genre: string;
  team: string;
  members: number;
  players: number;
  stand: string | null;
  description: string;
  about: string[] | null;
  platforms: string[];
  itchioUrl: string | null;
  image: GameImageDto;
  gallery: GameImageDto[];
}

function toImageDto(image: GameImage): GameImageDto {
  return { src: image.src, alt: image.alt, position: image.position };
}

/** Juego de dominio -> DTO que responde el Route Handler. */
export function toGameDto(game: Game): GameDto {
  return {
    slug: game.slug,
    name: game.name,
    genre: game.genre,
    team: game.team,
    members: game.members,
    players: game.players,
    stand: game.stand,
    description: game.description,
    about: game.about ? [...game.about] : null,
    platforms: [...game.platforms],
    itchioUrl: game.itchioUrl,
    image: toImageDto(game.image),
    gallery: game.gallery.map(toImageDto),
  };
}

type JsonObject = Record<string, unknown>;

function fail(path: string): never {
  throw new Error(`La respuesta de la API de juegos no tiene el formato esperado (${path}).`);
}

function asObject(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path);
  }

  return value as JsonObject;
}

function readString(source: JsonObject, key: string, path: string): string {
  const value = source[key];

  return typeof value === "string" ? value : fail(`${path}.${key}`);
}

function readOptionalString(source: JsonObject, key: string, path: string): string | null {
  const value = source[key];

  return value === null ? null : readString(source, key, path);
}

function readNumber(source: JsonObject, key: string, path: string): number {
  const value = source[key];

  return typeof value === "number" && Number.isFinite(value) ? value : fail(`${path}.${key}`);
}

function parseStrings(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    fail(path);
  }

  return value.map((item, index) => (typeof item === "string" ? item : fail(`${path}[${index}]`)));
}

function parseAbout(value: unknown, path: string): Game["about"] {
  return value === null ? null : parseStrings(value, path);
}

function parseImage(value: unknown, path: string): GameImage {
  const image = asObject(value, path);

  return {
    src: readString(image, "src", path),
    alt: readString(image, "alt", path),
    position: readOptionalString(image, "position", path),
  };
}

function parseGallery(value: unknown, path: string): GameImage[] {
  if (!Array.isArray(value)) {
    fail(path);
  }

  return value.map((image, index) => parseImage(image, `${path}[${index}]`));
}

function parseGame(value: unknown, path: string): Game {
  const game = asObject(value, path);

  return {
    slug: readString(game, "slug", path),
    name: readString(game, "name", path),
    genre: readString(game, "genre", path),
    team: readString(game, "team", path),
    members: readNumber(game, "members", path),
    players: readNumber(game, "players", path),
    stand: readOptionalString(game, "stand", path),
    description: readString(game, "description", path),
    about: parseAbout(game.about, `${path}.about`),
    platforms: parseStrings(game.platforms, `${path}.platforms`),
    itchioUrl: readOptionalString(game, "itchioUrl", path),
    image: parseImage(game.image, `${path}.image`),
    gallery: parseGallery(game.gallery, `${path}.gallery`),
  };
}

/**
 * Valida el JSON de `/api/games` y lo convierte en juegos de dominio. Lanza un error que nombra
 * el primer campo inválido (por ejemplo `[3].image.alt`); TanStack Query lo muestra como error
 * de la query.
 */
export function parseGamesResponse(value: unknown): Game[] {
  if (!Array.isArray(value)) {
    fail("se esperaba una lista");
  }

  return value.map((game, index) => parseGame(game, `[${index}]`));
}
