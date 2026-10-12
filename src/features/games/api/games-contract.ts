import type { ArtColor, Game } from "@features/games/lib/types";

/**
 * Contrato HTTP de `/api/games`: lo que viaja entre el Route Handler y el navegador.
 *
 * Es un tipo propio y no el tipo de dominio `Game`: si `Game` cambia, TypeScript obliga a
 * decidir aquí qué se publica (`toGameDto`) y cómo se lee (`parseGamesResponse`), en lugar de
 * romper el navegador en silencio.
 */
export interface GameDto {
  slug: string;
  name: string;
  genre: string;
  team: string;
  members: number;
  players: number;
  stand: string;
  hasTournament: boolean;
  description: string;
  about: string[] | null;
  image: { src: string; position: string } | null;
  art: { seed: number; palette: [ArtColor, ArtColor] };
}

const ART_COLORS: readonly ArtColor[] = ["acid", "black", "white", "panel", "light"];

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
    hasTournament: game.hasTournament,
    description: game.description,
    about: game.about ? [...game.about] : null,
    image: game.image ? { src: game.image.src, position: game.image.position } : null,
    art: { seed: game.art.seed, palette: [game.art.palette[0], game.art.palette[1]] },
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

function readNumber(source: JsonObject, key: string, path: string): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fail(`${path}.${key}`);
}

function readBoolean(source: JsonObject, key: string, path: string): boolean {
  const value = source[key];
  return typeof value === "boolean" ? value : fail(`${path}.${key}`);
}

function readArtColor(value: unknown, path: string): ArtColor {
  return ART_COLORS.find((color) => color === value) ?? fail(path);
}

function parseAbout(value: unknown, path: string): Game["about"] {
  if (value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    fail(path);
  }
  return value.map((paragraph, index) => (typeof paragraph === "string" ? paragraph : fail(`${path}[${index}]`)));
}

function parseImage(value: unknown, path: string): Game["image"] {
  if (value === null) {
    return null;
  }
  const image = asObject(value, path);
  return { src: readString(image, "src", path), position: readString(image, "position", path) };
}

function parseArt(value: unknown, path: string): Game["art"] {
  const art = asObject(value, path);
  const palette = art.palette;
  if (!Array.isArray(palette) || palette.length !== 2) {
    fail(`${path}.palette`);
  }
  return {
    seed: readNumber(art, "seed", path),
    palette: [readArtColor(palette[0], `${path}.palette[0]`), readArtColor(palette[1], `${path}.palette[1]`)],
  };
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
    stand: readString(game, "stand", path),
    hasTournament: readBoolean(game, "hasTournament", path),
    description: readString(game, "description", path),
    about: parseAbout(game.about, `${path}.about`),
    image: parseImage(game.image, `${path}.image`),
    art: parseArt(game.art, `${path}.art`),
  };
}

/**
 * Valida el JSON de `/api/games` y lo convierte en juegos de dominio. Lanza un error que nombra
 * el primer campo inválido (por ejemplo `[3].art.palette[1]`); TanStack Query lo muestra como
 * error de la query.
 */
export function parseGamesResponse(value: unknown): Game[] {
  if (!Array.isArray(value)) {
    fail("se esperaba una lista");
  }
  return value.map((game, index) => parseGame(game, `[${index}]`));
}
