"use server";

import { refresh, updateTag } from "next/cache";
import { requireStandAdmin } from "@features/accounts/lib/server/current-account";
import { parseStandGameInput } from "@features/games/lib/game-input";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { saveStandGame } from "@features/games/lib/server/stand-game-mutations";

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
