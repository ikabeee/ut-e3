import "server-only";
import type { Prisma } from "@generated/prisma/client";

export interface AuditEntry {
  /**
   * The account that made the change; null when no staff account did, such as the automatic close of the public
   * bracket (RF-74) or a visitor's own email recovery.
   */
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
