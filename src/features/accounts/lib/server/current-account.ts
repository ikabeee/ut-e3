import "server-only";
import { redirect } from "next/navigation";
import { getHomePath, LOGIN_PATH, STAND_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { getManagedRoles } from "@features/accounts/lib/invitation-rules";
import type { ManagingActor } from "@features/accounts/lib/server/invitations";
import { KOF_DESKS, type AccountRole, type KofDesk } from "@features/accounts/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { getSessionAccount, type SessionAccount } from "@shared/lib/server/session";

const SYSADMIN_ROLE = "sysadmin" satisfies AccountRole;

// The guards of an area accept an account whose primary role OR secondary role is one the area asks for (S1, S2), and
// hand it back with that role as its `role`, so the code of the area (and its audit entries) acts as that role. The
// stand guards are the exception: they keep the primary role and the stand of the account.

// Every sysadmin page and Server Action calls this: proxy.ts only checks that a cookie exists.
export async function requireSysadmin(): Promise<SessionAccount> {
  const account = await getSysadmin();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  return account;
}

// For Route Handlers, which answer 401 instead of redirecting.
export async function getSysadmin(): Promise<SessionAccount | null> {
  const account = await getSessionAccount();

  return account ? withRoleOf(account, [SYSADMIN_ROLE]) : null;
}

export interface KofAccount extends SessionAccount {
  role: "kof_admin" | "kof_staff";
  /** Only a staff member has a desk, and one that was not assigned yet captures nothing. */
  kofDesk: KofDesk | null;
}

// Every KOF Server Action calls this. The sysadmin operates the tournament as a KOF administrator (S5): it gets that role
// and no desk, and everything it does is recorded under its own account.
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

  if (account?.roles.includes(SYSADMIN_ROLE)) return { ...account, role: "kof_admin", kofDesk: null };

  return toKofAccount(account);
}

/** Who may open /admin/kof: the KOF accounts, and the sysadmin, which keeps its own role to show its header and navigation. */
export interface KofViewer extends SessionAccount {
  role: KofAccount["role"] | "sysadmin";
  kofDesk: KofDesk | null;
}

// The pages and reads of the KOF section: the admin panel links the sysadmin to /admin/kof, so it must get in. Its
// commands go through requireKofAccount, which treats it as a KOF administrator.
export async function requireKofViewer(): Promise<KofViewer> {
  const viewer = await getKofViewer();

  if (!viewer) {
    redirect(LOGIN_PATH);
  }

  return viewer;
}

// For Route Handlers that only read, which answer 401 instead of redirecting.
export async function getKofViewer(): Promise<KofViewer | null> {
  const account = await getSessionAccount();

  if (account?.roles.includes(SYSADMIN_ROLE)) return { ...account, role: SYSADMIN_ROLE, kofDesk: null };

  return toKofAccount(account);
}

// A KOF administrator, by its primary or its secondary role, has no desk; the staff member is always a primary role.
async function toKofAccount(account: SessionAccount | null): Promise<KofAccount | null> {
  if (account?.roles.includes("kof_admin")) return { ...account, role: "kof_admin", kofDesk: null };

  if (account?.role !== "kof_staff") return null;

  const row = await getPrisma().account.findUnique({ where: { id: account.id }, select: { kofDesk: true } });

  return { ...account, role: "kof_staff", kofDesk: toKofDesk(row?.kofDesk ?? null) };
}

const RAFFLE_ROLES: readonly string[] = ["raffle_admin", SYSADMIN_ROLE];

// Every raffle page and Server Action calls this; the raffle administrators and the sysadmin (S5) spin, decide and
// register prizes. Draws and audit rows carry the account of whoever acted.
export async function requireRaffleAdmin(): Promise<SessionAccount> {
  const account = await getRaffleAdmin();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  return account;
}

// For Route Handlers, which answer 401 instead of redirecting.
export async function getRaffleAdmin(): Promise<SessionAccount | null> {
  const account = await getSessionAccount();

  return account ? withRoleOf(account, RAFFLE_ROLES) : null;
}

export interface StandAccount extends SessionAccount {
  role: "stand_admin" | "stand_staff";
  /** The stand whose kiosk the account opens; the table guarantees every stand account has one. */
  standId: string;
}

// Every kiosk page and Server Action calls this: the account only ever works at its own stand (RF-33).
export async function requireStandAccount(): Promise<StandAccount> {
  const account = await getStandAccount();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  return account;
}

// For Route Handlers, which answer 401 instead of redirecting.
export async function getStandAccount(): Promise<StandAccount | null> {
  const account = await getSessionAccount();
  const role = account ? toStandRole(account.role) : null;

  if (!account || !role) return null;

  const row = await getPrisma().account.findUnique({ where: { id: account.id }, select: { standId: true } });

  return row?.standId ? { ...account, role, standId: row.standId } : null;
}

// The pages and Server Actions of the game and the staff of a stand (RF-31, RF-32). The staff of the stand goes back to
// its kiosk, because it has a session but not this role.
export async function requireStandAdmin(): Promise<StandAccount> {
  const account = await getStandAccount();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  if (account.role !== "stand_admin") {
    redirect(STAND_HOME_PATH);
  }

  return account;
}

const RECOVERY_ROLES: readonly string[] = ["help_desk", "sysadmin"];

// The recovery desk (RF-69): the help desk does the work and the sysadmin can cover it. Any other role goes back to
// its own home instead of the login, because it does have a session.
export async function requireRecoveryAgent(): Promise<SessionAccount> {
  const account = await getSessionAccount();

  if (!account) {
    redirect(LOGIN_PATH);
  }

  const agent = withRoleOf(account, RECOVERY_ROLES);

  if (!agent) {
    redirect(getHomePath(account.role));
  }

  return agent;
}

// The account as the first of its roles that the area accepts, or null when none of them is.
function withRoleOf(account: SessionAccount, accepted: readonly string[]): SessionAccount | null {
  const role = account.roles.find((candidate) => accepted.includes(candidate));

  return role ? { ...account, role } : null;
}

function toStandRole(role: string): StandAccount["role"] | null {
  return role === "stand_admin" || role === "stand_staff" ? role : null;
}

function toKofDesk(value: number | null): KofDesk | null {
  return KOF_DESKS.find((desk) => desk === value) ?? null;
}

// Whoever invites, resends or disables accounts: the sysadmin, the KOF administrator and the stand administrator, also
// by a secondary role. The actor keeps its primary role and carries the secondary one, because the same account manages
// its stand's staff from the stand and the KOF staff from the KOF (L14); what each one may manage is decided again for
// the target account by the functions of `invitations.ts`.
export async function requireAccountManager(): Promise<ManagingActor> {
  const account = await getSessionAccount();
  const secondaryRole = account?.roles.find((role) => role !== account.role) ?? null;

  if (!account || getManagedRoles(account.role, secondaryRole).length === 0) {
    redirect(LOGIN_PATH);
  }

  const row = await getPrisma().account.findUnique({ where: { id: account.id }, select: { standId: true } });

  return { ...account, secondaryRole, standId: row?.standId ?? null };
}
