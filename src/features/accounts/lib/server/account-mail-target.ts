import "server-only";
import type { Prisma } from "@generated/prisma/client";

/** What an email to an account needs from it: where it goes, who it greets, and its status to know if it still applies. */
export function findAccountMailTarget(transaction: Prisma.TransactionClient, accountId: string) {
  return transaction.account.findUnique({
    where: { id: accountId },
    select: { id: true, email: true, name: true, status: true },
  });
}
