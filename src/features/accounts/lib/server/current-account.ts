import "server-only";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import type { AccountRole } from "@features/accounts/lib/types";
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
