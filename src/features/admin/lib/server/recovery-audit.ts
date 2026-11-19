import "server-only";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

interface RecoveryAuditEntry {
  actorId: string;
  /** What was done, without the prefix: "smtp_test" is recorded as "admin.recovery.smtp_test". */
  action: string;
  /** The service or the file it was done to. */
  target: string;
  detail: Prisma.InputJsonValue;
}

/** Every action of /admin/recovery leaves an entry in the audit log, in a transaction of its own (RNF-11). */
export async function auditRecovery({ actorId, action, target, detail }: RecoveryAuditEntry): Promise<void> {
  await getPrisma().$transaction((transaction) =>
    recordAudit(transaction, {
      actorId,
      action: `admin.recovery.${action}`,
      entityType: "recovery",
      entityId: target,
      detail,
    }),
  );
}
