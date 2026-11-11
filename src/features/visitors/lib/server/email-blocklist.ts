import "server-only";
import type { BlockedEmail } from "@features/visitors/lib/types";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";

const ENTITY_TYPE = "email_blocklist";

export async function listBlockedEmails(): Promise<BlockedEmail[]> {
  const rows = await getPrisma().emailBlocklist.findMany({ orderBy: { email: "asc" } });

  const visitors = await getPrisma().visitor.findMany({
    where: { email: { in: rows.map((row) => row.email) } },
    select: { email: true },
  });

  const registered = new Set(visitors.map((visitor) => visitor.email.toLowerCase()));

  return rows.map((row) => ({
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    hasPassport: registered.has(row.email.toLowerCase()),
  }));
}

/**
 * Adds the addresses that are not on the list yet (the column compares without case) and returns how many it added.
 * The audit log keeps a hash of each address instead of the address itself.
 */
export async function addBlockedEmails(actorId: string, emails: readonly string[]): Promise<number> {
  return getPrisma().$transaction(async (transaction) => {
    const existing = await transaction.emailBlocklist.findMany({ where: { email: { in: [...emails] } } });
    const taken = new Set(existing.map((row) => row.email.toLowerCase()));
    const fresh = emails.filter((email) => !taken.has(email));

    for (const email of fresh) {
      await transaction.emailBlocklist.create({ data: { email } });
      await recordAudit(transaction, {
        actorId,
        action: "email_blocklist.add",
        entityType: ENTITY_TYPE,
        entityId: hashToken(email),
        detail: {},
      });
    }

    return fresh.length;
  });
}

export async function removeBlockedEmail(actorId: string, email: string): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const { count } = await transaction.emailBlocklist.deleteMany({ where: { email } });

    if (count === 0) return false;

    await recordAudit(transaction, {
      actorId,
      action: "email_blocklist.remove",
      entityType: ENTITY_TYPE,
      entityId: hashToken(email.toLowerCase()),
      detail: {},
    });

    return true;
  });
}
