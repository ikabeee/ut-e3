import "server-only";
import type { Prisma } from "@generated/prisma/client";

export interface AuditEntry {
  /** Null when the system itself made the change, such as the automatic close of the public bracket (RF-74). */
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  detail: Prisma.InputJsonValue;
}

// Takes the transaction of the change it records (RNF-11), so the change and its entry commit or fail together.
export async function recordAudit(transaction: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  await transaction.auditLog.create({ data: entry });
}
