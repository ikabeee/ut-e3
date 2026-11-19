import "server-only";
import type { AccountAdminFilter } from "@features/accounts/lib/account-admin-filter";
import type { AdminAccountRow } from "@features/accounts/lib/types";
import { toKofDesk, toStatus } from "@features/accounts/lib/server/invitations";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

const LOGIN_ACTION = "account.login_verified";

/** Every staff account of every role for the sysadmin, by role and name, with its last verified sign-in (S8). */
export async function listAllAccounts(filter: AccountAdminFilter): Promise<AdminAccountRow[]> {
  const rows = await getPrisma().account.findMany({
    where: buildWhere(filter),
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      standId: true,
      kofDesk: true,
      createdAt: true,
    },
  });

  const lastLogins = await readLastLogins(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    status: toStatus(row.status),
    kofDesk: toKofDesk(row.kofDesk),
    lastLoginAt: lastLogins.get(row.id) ?? null,
  }));
}

function buildWhere({ role, status, standId, search }: AccountAdminFilter): Prisma.AccountWhereInput {
  return {
    role,
    status,
    standId,
    OR: search ? [{ name: { contains: search } }, { email: { contains: search } }] : undefined,
  };
}

// The sign-in is not stored on the account: the audit log keeps one entry per verified code (RNF-11).
async function readLastLogins(accountIds: string[]): Promise<Map<string, Date>> {
  const groups = await getPrisma().auditLog.groupBy({
    by: ["entityId"],
    where: { action: LOGIN_ACTION, entityType: "account", entityId: { in: accountIds } },
    _max: { createdAt: true },
  });

  return new Map(groups.flatMap((group) => (group._max.createdAt ? [[group.entityId, group._max.createdAt]] : [])));
}
