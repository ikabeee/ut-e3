import "server-only";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";

export interface DevAccount {
  email: string;
  name: string;
  role: string;
  kofDesk?: number | null;
  standId?: string;
}

/** Development seeds only: active accounts with an example password. Returns the emails that did not exist yet. */
export async function createMissingDevAccounts(accounts: readonly DevAccount[], password: string): Promise<string[]> {
  const created: string[] = [];

  for (const account of accounts) {
    if (await getPrisma().account.findUnique({ where: { email: account.email }, select: { id: true } })) continue;

    await getPrisma().account.create({
      data: { ...account, status: "active", password: await hashPassword(password) },
    });
    created.push(account.email);
  }

  return created;
}
