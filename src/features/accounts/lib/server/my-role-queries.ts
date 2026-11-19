import "server-only";
import { toKofDesk } from "@features/accounts/lib/server/invitations";
import type { KofDesk } from "@features/accounts/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

const LOGIN_ACTION = "account.login_verified";

/** The stand of an account as the database has it; the page builds the code with `formatAdminStandCode`. */
export interface MyRoleStandRow {
  zone: string;
  number: number;
  studio: number;
  groupCode: string;
  gameName: string | null;
  /** The active administrator of the stand; null when it has none (disabled or only invited). */
  adminName: string | null;
}

export interface MyRoleDetails {
  stand: MyRoleStandRow | null;
  kofDesk: KofDesk | null;
}

const NO_DETAILS: MyRoleDetails = { stand: null, kofDesk: null };

/** What the page of the role needs besides the roles of the session: the stand, its game and administrator, and the KOF desk (S4). */
export async function getMyRoleDetails(accountId: string): Promise<MyRoleDetails> {
  const account = await getPrisma().account.findUnique({
    where: { id: accountId },
    select: {
      kofDesk: true,
      stand: {
        select: {
          zone: true,
          number: true,
          studio: true,
          groupCode: true,
          game: { select: { name: true } },
          accounts: { where: { role: "stand_admin", status: "active" }, select: { name: true }, take: 1 },
        },
      },
    },
  });

  if (!account) return NO_DETAILS;

  const { stand } = account;

  return {
    kofDesk: toKofDesk(account.kofDesk),
    stand: stand && {
      zone: stand.zone,
      number: stand.number,
      studio: stand.studio,
      groupCode: stand.groupCode,
      gameName: stand.game?.name ?? null,
      adminName: stand.accounts[0]?.name ?? null,
    },
  };
}

/**
 * True when the verified login that was just recorded is the only one of the account in the audit log, that is, it had
 * none before (S4): that login goes to the page of the role before the work screen. No column marks it. Call it after
 * `verifyLoginCode`, which records the entry; a wrong code records another action and does not count.
 */
export async function isFirstVerifiedLogin(accountId: string): Promise<boolean> {
  const logins = await getPrisma().auditLog.count({ where: { actorId: accountId, action: LOGIN_ACTION } });

  return logins <= 1;
}
