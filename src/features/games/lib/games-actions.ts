"use server";

import { parseCatalogOptionInput, parseGameImageInput, parseGameInput } from "@features/games/lib/catalog-validation";
import {
  createGenre,
  createPlatform,
  deleteGenre,
  deletePlatform,
  updateGenre,
  updatePlatform,
} from "@features/games/lib/server/catalog-options-queries";
import { addGameImage, deleteGameImage, updateGameImage } from "@features/games/lib/server/game-images-queries";
import { createGame, deleteGame, updateGame } from "@features/games/lib/server/games-admin-queries";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { runAdminAction } from "@shared/lib/server/admin-action";
import type { RawInput } from "@shared/lib/validation";

// Server Actions del panel de administración para el catálogo: juegos, fotos, géneros y
// plataformas. Todas comprueban permisos (runAdminAction) e invalidan la caché de los juegos;
// en el navegador, el panel invalida también `gamesQueryKeys.all` de TanStack Query.

const CATALOG_CONSTRAINT_MESSAGES = {
  game_slug_key: "Ya existe un juego con ese slug.",
  game_team_id_key: "Ese equipo ya tiene un juego.",
  game_players_range: "Los jugadores deben ser entre 1 y 16.",
  game_about_length: "Acerca del juego: máximo 3000 caracteres.",
  game_team_id_fkey: "El equipo ya no existe.",
  game_genre_id_fkey: "El género ya no existe o hay juegos que lo usan.",
  game_genre_genre_id_fkey: "El género ya no existe o hay juegos que lo usan.",
  game_platform_platform_id_fkey: "La plataforma ya no existe o hay juegos que la usan.",
  check_in_game_id_fkey: "No se puede borrar: el juego ya tiene check-ins.",
  game_image_game_id_sort_order_key: "Ya hay una foto en esa posición.",
  game_image_one_cover: "El juego ya tiene una portada.",
  genre_slug_key: "Ya existe un género con ese slug.",
  genre_name_key: "Ya existe un género con ese nombre.",
  platform_slug_key: "Ya existe una plataforma con ese slug.",
  platform_name_key: "Ya existe una plataforma con ese nombre.",
};

const options = { invalidateTags: [GAMES_CACHE_TAG], constraintMessages: CATALOG_CONSTRAINT_MESSAGES };

// Juegos

export async function createGameAction(input: RawInput) {
  return runAdminAction(() => createGame(parseGameInput(input)), options);
}

export async function updateGameAction(gameId: string, input: RawInput) {
  return runAdminAction(() => updateGame(gameId, parseGameInput(input)), options);
}

export async function deleteGameAction(gameId: string) {
  return runAdminAction(() => deleteGame(gameId), options);
}

// Fotos

export async function addGameImageAction(gameId: string, input: RawInput) {
  return runAdminAction(() => addGameImage(gameId, parseGameImageInput(input)), options);
}

export async function updateGameImageAction(imageId: string, input: RawInput) {
  return runAdminAction(() => updateGameImage(imageId, parseGameImageInput(input)), options);
}

export async function deleteGameImageAction(imageId: string) {
  return runAdminAction(() => deleteGameImage(imageId), options);
}

// Géneros

export async function createGenreAction(input: RawInput) {
  return runAdminAction(() => createGenre(parseCatalogOptionInput(input)), options);
}

export async function updateGenreAction(genreId: string, input: RawInput) {
  return runAdminAction(() => updateGenre(genreId, parseCatalogOptionInput(input)), options);
}

export async function deleteGenreAction(genreId: string) {
  return runAdminAction(() => deleteGenre(genreId), options);
}

// Plataformas

export async function createPlatformAction(input: RawInput) {
  return runAdminAction(() => createPlatform(parseCatalogOptionInput(input)), options);
}

export async function updatePlatformAction(platformId: string, input: RawInput) {
  return runAdminAction(() => updatePlatform(platformId, parseCatalogOptionInput(input)), options);
}

export async function deletePlatformAction(platformId: string) {
  return runAdminAction(() => deletePlatform(platformId), options);
}
