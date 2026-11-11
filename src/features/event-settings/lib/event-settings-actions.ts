"use server";

import { refresh, updateTag } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { EVENT_SETTINGS_COPY } from "@features/event-settings/lib/event-settings-copy";
import { parseEventSettingsInput, type EventSettingsErrors } from "@features/event-settings/lib/event-settings-input";
import { EVENT_SETTINGS_CACHE_TAG } from "@features/event-settings/lib/server/event-settings-queries";
import { updateEventSettings } from "@features/event-settings/lib/server/event-settings-mutations";

export type EventSettingsFormState =
  { status: "done"; message: string } | { status: "error"; message: string; errors?: EventSettingsErrors };

const COPY = EVENT_SETTINGS_COPY.admin;

// A Server Action is a public endpoint: only the sysadmin edits the values of the event (RF-43).
export async function saveEventSettingsAction(
  _previous: EventSettingsFormState | null,
  form: FormData,
): Promise<EventSettingsFormState> {
  const actor = await requireSysadmin();
  const parsed = parseEventSettingsInput(form);

  if (!parsed.isValid) return { status: "error", message: COPY.errors.invalid, errors: parsed.errors };

  const result = await updateEventSettings(actor.id, parsed.settings);

  switch (result.status) {
    case "missingRow":
      return { status: "error", message: COPY.errors.missingRow };
    case "rejected":
      return { status: "error", message: COPY.errors.rejected };
    case "unchanged":
      return { status: "done", message: COPY.unchanged };
    case "saved":
      // The landing, the passport and the kiosk read these values from the cache of this tag.
      updateTag(EVENT_SETTINGS_CACHE_TAG);
      refresh();

      return { status: "done", message: COPY.saved };
  }
}
