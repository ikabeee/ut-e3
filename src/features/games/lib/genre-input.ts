import { buildGameSlug } from "@features/games/lib/game-slug";
import { readFormText } from "@shared/lib/form-data";

export const GENRE_NAME_MIN_LENGTH = 2;

export const GENRE_NAME_MAX_LENGTH = 40;

export type ParsedGenre = { isValid: true; name: string; slug: string } | { isValid: false };

/** The name of a genre of the catalog (RF-72) and its URL name, which the catalog of games filters by. */
export function parseGenreInput(form: FormData): ParsedGenre {
  const name = readFormText(form, "name").trim().replaceAll(/\s+/g, " ");

  if (name.length < GENRE_NAME_MIN_LENGTH || name.length > GENRE_NAME_MAX_LENGTH) return { isValid: false };

  if (!/[\p{L}\p{N}]/u.test(name)) return { isValid: false };

  return { isValid: true, name, slug: buildGameSlug(name) };
}
