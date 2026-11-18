"use server";

import { refresh, updateTag } from "next/cache";
import { requireStandAdmin } from "@features/accounts/lib/server/current-account";
import { parseStandGameInput } from "@features/games/lib/game-input";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { deleteStandGame, saveStandGame } from "@features/games/lib/server/stand-game-mutations";
import { readFormText } from "@shared/lib/form-data";

export type StandGameActionState = { status: "done"; message: string } | { status: "error"; message: string };

const COPY = GAMES_COPY.standGame;

// A Server Action is a public endpoint: the session and the role are checked here, and the stand is the one of the
// session, so the form cannot name another one (RF-31).
export async function saveStandGameAction(
  _previous: StandGameActionState | null,
  form: FormData,
): Promise<StandGameActionState> {
  const account = await requireStandAdmin();
  const parsed = parseStandGameInput(form);

  if (!parsed.isValid) return { status: "error", message: parsed.message };

  const result = await saveStandGame({ actor: account, input: parsed.input });

  if (result.status === "invalidGenre") return { status: "error", message: COPY.errors.genreInvalid };

  if (result.status === "conflict") return { status: "error", message: COPY.errors.conflict };

  updateTag(GAMES_CACHE_TAG);
  refresh();

  return { status: "done", message: COPY.outcomes[result.status] };
}

// Deleting is for the administrator of the stand that owns the game: the game is the one of the session, and the form
// only carries the confirmation that the interface asked for (S27).
export async function deleteStandGameAction(
  _previous: StandGameActionState | null,
  form: FormData,
): Promise<StandGameActionState> {
  const account = await requireStandAdmin();

  if (readFormText(form, "intent") !== "delete") return { status: "error", message: COPY.errors.deleteNotConfirmed };

  const result = await deleteStandGame(account);

  if (result.status === "noGame") return { status: "error", message: COPY.errors.noGame };

  updateTag(GAMES_CACHE_TAG);
  refresh();

  return { status: "done", message: COPY.outcomes.deleted };
}
