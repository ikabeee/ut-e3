import "server-only";
import type { EditableEventSettings } from "@features/event-settings/lib/event-settings-input";
import { toEditableSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { EVENT_SETTINGS_ID } from "@features/event-settings/lib/server/event-settings-seed";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isCheckViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export type UpdateEventSettingsResult = { status: "saved" | "unchanged" | "missingRow" | "rejected" };

type Changes = Partial<
  Record<keyof EditableEventSettings, { before: string | number | null; after: string | number | null }>
>;

/**
 * Saves the values of the single row (RF-43). Only the fields that changed go to the audit log, in the same
 * transaction. A CHECK of the table that refuses the row (an order or a threshold the form did not catch) is
 * answered as `rejected` and the row stays as it was (UT-ES-01, UT-AD-16).
 */
export async function updateEventSettings(
  actorId: string,
  settings: EditableEventSettings,
): Promise<UpdateEventSettingsResult> {
  try {
    return await getPrisma().$transaction(async (transaction): Promise<UpdateEventSettingsResult> => {
      const row = await transaction.eventSettings.findUnique({ where: { id: EVENT_SETTINGS_ID } });

      if (!row) return { status: "missingRow" };

      const changes = diffSettings(toEditableSettings(row), settings);

      if (Object.keys(changes).length === 0) return { status: "unchanged" };

      await transaction.eventSettings.update({ where: { id: EVENT_SETTINGS_ID }, data: settings });
      await recordAudit(transaction, {
        actorId,
        action: "event_settings.update",
        entityType: "event_settings",
        entityId: String(EVENT_SETTINGS_ID),
        detail: changes,
      });

      return { status: "saved" };
    });
  } catch (cause) {
    if (isCheckViolation(cause)) return { status: "rejected" };

    throw cause;
  }
}

function diffSettings(before: EditableEventSettings, after: EditableEventSettings): Changes {
  const changes: Changes = {};

  // SAFETY: `after` is an EditableEventSettings, so its own keys are exactly the fields of that type.
  for (const field of Object.keys(after) as (keyof EditableEventSettings)[]) {
    if (before[field] !== after[field]) changes[field] = { before: before[field], after: after[field] };
  }

  return changes;
}
