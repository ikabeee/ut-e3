"use server";

import { refresh } from "next/cache";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { purgeExpiredServerLogs, SERVER_LOG_RETENTION_DAYS } from "@shared/lib/server/server-log-retention";

/**
 * "Purgar ahora": the same purge the hourly interval runs (rows older than 30 days, never newer ones), with the
 * sysadmin and the count in the audit log. A Server Action is a public endpoint: the session is checked first.
 */
export async function purgeServerLogsAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  const deleted = await getPrisma().$transaction(async (transaction) => {
    const count = await purgeExpiredServerLogs(transaction);

    await recordAudit(transaction, {
      actorId: actor.id,
      action: "admin.server_logs.purge",
      entityType: "server_logs",
      entityId: "retention",
      detail: { deleted: count, olderThanDays: SERVER_LOG_RETENTION_DAYS },
    });

    return count;
  });

  refresh();

  return { status: "done", message: ADMIN_COPY.logs.purged(deleted) };
}
