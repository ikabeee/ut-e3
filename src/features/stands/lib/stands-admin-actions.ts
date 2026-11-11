"use server";

import { updateTag } from "next/cache";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { parseAdminPerson, parseNewStand, parseStandFields } from "@features/stands/lib/stand-input";
import { createStand, inviteStandAdmin, updateStand } from "@features/stands/lib/server/stand-admin-mutations";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { readFormText } from "@shared/lib/form-data";

const COPY = STANDS_COPY.admin;

type Refusal = "standTaken" | "limitReached" | "adminExists" | "notFound" | "emailTaken" | "hasPassport";

// Server Actions are public endpoints: each one checks that the session is the sysadmin before reading the form
// (RF-39). Disabling an account goes through the actions of the accounts panel, which check their own rules.
export async function createStandAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const parsed = parseNewStand(form);

  if (!parsed.isValid) return failManagement(parsed.message);

  const result = await createStand({ actor, fields: parsed.fields, admin: parsed.admin, now: new Date() });

  if (result.status !== "created") return failManagement(describe(result.status));

  return finishManagement(COPY.outcomes.created, result.emailId);
}

export async function updateStandAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const parsed = parseStandFields(form);

  if (!parsed.isValid) return failManagement(parsed.message);

  const result = await updateStand({ actor, standId: readFormText(form, "standId"), fields: parsed.fields });

  if (result.status !== "updated") return failManagement(describe(result.status));

  // The code of the stand is part of what the catalog and the floor plan show.
  updateTag(GAMES_CACHE_TAG);

  return finishManagement(COPY.outcomes.updated);
}

export async function inviteStandAdminAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const parsed = parseAdminPerson(form);

  if (!parsed.isValid) return failManagement(parsed.message);

  const standId = readFormText(form, "standId");
  const result = await inviteStandAdmin({ actor, standId, admin: parsed.admin, now: new Date() });

  if (result.status !== "invited") return failManagement(describe(result.status));

  return finishManagement(COPY.outcomes.adminInvited, result.emailId);
}

function describe(status: Refusal): string {
  return COPY.errors[status];
}
