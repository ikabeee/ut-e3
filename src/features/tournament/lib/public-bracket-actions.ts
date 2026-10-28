"use server";

import { refresh } from "next/cache";
import { requireKofAccount } from "@features/accounts/lib/server/current-account";
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { readFormText } from "@shared/lib/form-data";

export type PublicBracketActionState = { status: "done"; message: string } | { status: "error"; message: string };

const COPY = TOURNAMENT_COPY.ui.publicBracket.admin;

// A Server Action is a public endpoint: only the KOF administrator closes or reopens the bracket (RF-74). The staff of the
// desks keep operating the tournament whatever this value is.
export async function setPublicBracketAction(
  _previous: PublicBracketActionState | null,
  form: FormData,
): Promise<PublicBracketActionState> {
  const actor = await requireKofAccount();

  if (actor.role !== "kof_admin") return { status: "error", message: COPY.forbidden };

  const enabled = parseEnabled(readFormText(form, "enabled"));

  if (enabled === null) return { status: "error", message: COPY.invalid };

  await setPublicBracketEnabled(actor.id, enabled);
  refresh();

  return { status: "done", message: enabled ? COPY.opened : COPY.closed };
}

function parseEnabled(value: string): boolean | null {
  if (value === "true") return true;

  return value === "false" ? false : null;
}
