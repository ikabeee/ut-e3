"use server";

import { refresh, updateTag } from "next/cache";
import { requireStandAdmin } from "@features/accounts/lib/server/current-account";
import { findGameImageSlot } from "@features/games/lib/game-image-slots";
import { GAME_IMAGE_MAX_BYTES, validateGameImage } from "@features/games/lib/game-image-validation";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { deleteStandGameImage, saveStandGameImage } from "@features/games/lib/server/stand-game-image-mutations";
import type { StandGameActionState } from "@features/games/lib/stand-game-actions";
import { readFormText } from "@shared/lib/form-data";

const COPY = GAMES_COPY.standGame.images;

// Server Actions are public endpoints: the session and the role are checked here, the game is the one of the stand of
// the session, and the file is validated against the grid before anything is written (RF-31).
export async function uploadGameImageAction(
  _previous: StandGameActionState | null,
  form: FormData,
): Promise<StandGameActionState> {
  const account = await requireStandAdmin();
  const slot = findGameImageSlot(readFormText(form, "slot"));
  const file = form.get("file");

  if (!slot) return failure(COPY.errors.unknownSlot);

  if (!(file instanceof File) || file.size === 0) return failure(COPY.errors.missing);

  // The size is known before the bytes are read: a file over the limit is never loaded into memory.
  if (file.size > GAME_IMAGE_MAX_BYTES) return failure(COPY.errors.tooLarge);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateGameImage(slot, bytes);

  if (problem) return failure(problem);

  try {
    const result = await saveStandGameImage({ actor: account, slot, bytes });

    return result.status === "noGame" ? failure(COPY.errors.noGame) : finish(COPY.outcomes.saved);
  } catch (cause) {
    return reportUnexpected(cause);
  }
}

export async function deleteGameImageAction(
  _previous: StandGameActionState | null,
  form: FormData,
): Promise<StandGameActionState> {
  const account = await requireStandAdmin();
  const slot = findGameImageSlot(readFormText(form, "slot"));

  if (!slot) return failure(COPY.errors.unknownSlot);

  try {
    const result = await deleteStandGameImage({ actor: account, slot });

    return result.status === "removed" ? finish(COPY.outcomes.removed) : failure(COPY.errors[result.status]);
  } catch (cause) {
    return reportUnexpected(cause);
  }
}

// A database or disk failure is logged for the operator; the administrator gets a message and can try again.
function reportUnexpected(cause: unknown): StandGameActionState {
  console.error("No se pudo guardar un cambio de las imágenes del juego.", cause);

  return failure(COPY.errors.unexpected);
}

function failure(message: string): StandGameActionState {
  return { status: "error", message };
}

// The catalog, the coverflow, the carousel, the game page and the shared image read the cache of the games.
function finish(message: string): StandGameActionState {
  updateTag(GAMES_CACHE_TAG);
  refresh();

  return { status: "done", message };
}
