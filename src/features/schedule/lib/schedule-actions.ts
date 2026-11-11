"use server";

import { updateTag } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { ZONE_IDS } from "@features/floor-plan/lib/types";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import { parseScheduleItemInput, type ScheduleItemErrors } from "@features/schedule/lib/schedule-item-input";
import { SCHEDULE_CACHE_TAG } from "@features/schedule/lib/server/schedule-queries";
import {
  createScheduleItem,
  removeScheduleItem,
  updateScheduleItem,
} from "@features/schedule/lib/server/schedule-mutations";
import { readFormText } from "@shared/lib/form-data";

export type ScheduleFormState =
  | { status: "saved" }
  | { status: "deleted" }
  | { status: "invalid"; errors: ScheduleItemErrors }
  | { status: "error"; message: string };

const NOT_FOUND: ScheduleFormState = { status: "error", message: SCHEDULE_COPY.admin.errors.notFound };

// Server Actions are public endpoints: each one checks the session and role before reading the form (RF-42).
export async function saveScheduleItem(
  _previous: ScheduleFormState | null,
  form: FormData,
): Promise<ScheduleFormState> {
  const actor = await requireSysadmin();
  const parsed = parseScheduleItemInput(form, ZONE_IDS);

  if (!parsed.isValid) return { status: "invalid", errors: parsed.errors };

  if (parsed.id) {
    if (!(await updateScheduleItem(actor.id, parsed.id, parsed.item))) return NOT_FOUND;
  } else {
    await createScheduleItem(actor.id, parsed.item);
  }

  updateTag(SCHEDULE_CACHE_TAG);

  return { status: "saved" };
}

export async function deleteScheduleItem(
  _previous: ScheduleFormState | null,
  form: FormData,
): Promise<ScheduleFormState> {
  const actor = await requireSysadmin();

  if (!(await removeScheduleItem(actor.id, readFormText(form, "id")))) return NOT_FOUND;

  updateTag(SCHEDULE_CACHE_TAG);

  return { status: "deleted" };
}
