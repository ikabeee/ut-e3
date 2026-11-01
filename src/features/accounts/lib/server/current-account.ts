import "server-only";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { getManagedRoles } from "@features/accounts/lib/invitation-rules";
import type { AccountRole, KofDesk } from "@features/accounts/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { getSessionAccount, type SessionAccount } from "@shared/lib/server/session";

const SYSADMIN_ROLE: AccountRole = "sysadmin";

// Every sysadmin page and Server Action calls this: proxy.ts only checks that a cookie exists.
export async function requireSysadmin(): Promise<SessionAccount> {
  const account = await getSessionAccount();

  if (account?.role !== SYSADMIN_ROLE) {
    redirect(LOGIN_PATH);
  }

  return account;
}

export interface KofAccount extends SessionAccount {
  role: "kof_admin" | "kof_staff";
  /** Only a staff member has a desk, and one that was not assigned yet captures nothing. */
  kofDesk: KofDesk | null;
}

// Every KOF page and Server Action calls this; the sysadmin has no tournament commands, only the KOF accounts do.
export async function requireKofAccount(): Promise<KofAccount> {
  const account = await getKofAccount();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  return account;
}

// For Route Handlers, which answer 401 instead of redirecting.
export async function getKofAccount(): Promise<KofAccount | null> {
  const account = await getSessionAccount();
  const role = account ? toKofRole(account.role) : null;

  if (!account || !role) return null;

  const row = await getPrisma().account.findUnique({ where: { id: account.id }, select: { kofDesk: true } });

  return { ...account, role, kofDesk: toKofDesk(row?.kofDesk ?? null) };
}

function toKofRole(role: string): KofAccount["role"] | null {
  return role === "kof_admin" || role === "kof_staff" ? role : null;
}

function toKofDesk(value: number | null): KofDesk | null {
  return value === 1 || value === 2 ? value : null;
}

// Whoever invites, resends or disables accounts: the sysadmin and the KOF administrator. What each one may manage is
// decided again for the target account by the functions of `invitations.ts`.
export async function requireAccountManager(): Promise<SessionAccount> {
  const account = await getSessionAccount();

  if (!account || getManagedRoles(account.role).length === 0) {
    redirect(LOGIN_PATH);
  }

  return account;
}
