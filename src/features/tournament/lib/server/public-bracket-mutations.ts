import "server-only";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

/**
 * Closes or reopens the public bracket (RF-74). The operation of the tournament does not depend on it. It writes the
 * audit entry only when the value changes, and answers whether it changed. A null actor is the system itself: the
 * automatic close on overload, whose `reason` names the metric.
 */
export async function setPublicBracketEnabled(
  actorId: string | null,
  enabled: boolean,
  reason?: string,
): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const settings = await transaction.eventSettings.findUnique({
      where: { id: 1 },
      select: { publicBracketEnabled: true },
    });

    if (!settings) throw new Error(TOURNAMENT_COPY.errors.missingSettings);

    if (settings.publicBracketEnabled === enabled) return false;

    await transaction.eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: enabled } });
    await recordAudit(transaction, {
      actorId,
      action: "kof_tournament.public_bracket",
      entityType: "event_settings",
      entityId: "1",
      detail: reason ? { enabled, reason } : { enabled },
    });

    return true;
  });
}
