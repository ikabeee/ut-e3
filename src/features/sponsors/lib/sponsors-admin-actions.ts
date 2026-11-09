"use server";

import { refresh, updateTag } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { parseSponsorInput, type SponsorErrors } from "@features/sponsors/lib/sponsor-input";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { deleteSponsor, saveSponsor } from "@features/sponsors/lib/server/sponsor-mutations";
import { SPONSORS_CACHE_TAG } from "@features/sponsors/lib/server/sponsors-queries";
import { readFormText } from "@shared/lib/form-data";

export type SponsorActionState =
  { status: "done"; message: string } | { status: "error"; message: string; errors?: SponsorErrors };

const COPY = SPONSORS_COPY.admin;

// Server Actions are public endpoints: only the sysadmin registers sponsors (RF-41).
export async function saveSponsorAction(
  _previous: SponsorActionState | null,
  form: FormData,
): Promise<SponsorActionState> {
  const actor = await requireSysadmin();
  const parsed = parseSponsorInput(form);

  if (!parsed.isValid)
    return { status: "error", message: Object.values(parsed.errors)[0] ?? "", errors: parsed.errors };

  const id = readFormText(form, "id");
  const result = await saveSponsor(actor.id, id, parsed.sponsor);

  if (result.status !== "saved") return { status: "error", message: COPY.errors[result.status] };

  return finish(id ? COPY.outcomes.updated : COPY.outcomes.created);
}

export async function deleteSponsorAction(
  _previous: SponsorActionState | null,
  form: FormData,
): Promise<SponsorActionState> {
  const actor = await requireSysadmin();
  const result = await deleteSponsor(actor.id, readFormText(form, "id"));

  if (result.status !== "saved") return { status: "error", message: COPY.errors[result.status] };

  return finish(COPY.outcomes.deleted);
}

// The landing and /sponsors read the sponsors from the cache of this tag (RF-47).
function finish(message: string): SponsorActionState {
  updateTag(SPONSORS_CACHE_TAG);
  refresh();

  return { status: "done", message };
}
