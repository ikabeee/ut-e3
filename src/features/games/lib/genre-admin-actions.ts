"use server";

import { refresh, updateTag } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { parseGenreInput } from "@features/games/lib/genre-input";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { createGenre, deleteGenre, renameGenre } from "@features/games/lib/server/genre-admin";
import { readFormText } from "@shared/lib/form-data";

export type GenreActionState = { status: "done"; message: string } | { status: "error"; message: string };

const COPY = GAMES_COPY.genresAdmin;

// Server Actions are public endpoints: only the sysadmin manages the catalog of genres (RF-72).
export async function saveGenreAction(_previous: GenreActionState | null, form: FormData): Promise<GenreActionState> {
  const actor = await requireSysadmin();
  const parsed = parseGenreInput(form);

  if (!parsed.isValid) return { status: "error", message: COPY.errors.nameLength };

  const id = readFormText(form, "id");
  const change = { name: parsed.name, slug: parsed.slug };
  const result = id ? await renameGenre(actor.id, id, change) : await createGenre(actor.id, change);

  if (result.status !== "saved") return { status: "error", message: COPY.errors[result.status] };

  return finish(id ? COPY.outcomes.renamed : COPY.outcomes.created);
}

export async function deleteGenreAction(_previous: GenreActionState | null, form: FormData): Promise<GenreActionState> {
  const actor = await requireSysadmin();
  const result = await deleteGenre(actor.id, readFormText(form, "id"));

  if (result.status !== "deleted") return { status: "error", message: COPY.errors[result.status] };

  return finish(COPY.outcomes.deleted);
}

// The name of a genre is shown in the catalog and in each game, which read the cache of the games.
function finish(message: string): GenreActionState {
  updateTag(GAMES_CACHE_TAG);
  refresh();

  return { status: "done", message };
}
