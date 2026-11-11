import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";

export type SysadminAction = (previous: null, form: FormData) => Promise<{ status: string }>;

/** Every role that is not the sysadmin, and no session at all. */
export const OTHER_ROLES = [
  "anonymous",
  "stand_admin",
  "stand_staff",
  "raffle_admin",
  "kof_admin",
  "kof_staff",
  "help_desk",
] as const;

let accountCounter = 0;

/** Every other role with every action: the rows of an `it.each`. */
export function otherRoleCases(actions: Record<string, SysadminAction>): [string, string, SysadminAction][] {
  return OTHER_ROLES.flatMap((role) =>
    Object.entries(actions).map(([name, action]): [string, string, SysadminAction] => [role, name, action]),
  );
}

/**
 * The action, called by that role, redirects to the login and leaves no audit entry: every write of the sysadmin
 * tools records one in its own transaction, so an empty log means nothing was written.
 */
export async function expectRefused(role: string, action: SysadminAction): Promise<void> {
  await signInAs(role);

  await expect(action(null, sysadminForm())).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  await expect(getPrisma().auditLog.count()).resolves.toBe(0);
}

/** A fresh cookie jar and, unless `anonymous`, an active account of that role with its session. */
export async function signInAs(role: string): Promise<string | null> {
  stubCookies(createCookieJar());

  if (role === "anonymous") return null;

  accountCounter += 1;

  // The staff of a stand always belongs to one (accounts_stand_role_check).
  const stand = role.startsWith("stand_")
    ? await getPrisma().stand.create({
        data: { zone: "A", number: accountCounter, studio: 1, groupCode: "101" },
        select: { id: true },
      })
    : null;

  const account = await getPrisma().account.create({
    data: {
      email: `rol${accountCounter}@ut.mx`,
      name: `Cuenta ${accountCounter}`,
      role,
      status: "active",
      password: "hash",
      standId: stand?.id ?? null,
    },
  });

  await createSession(account.id);

  return account.id;
}

/** A form that every action of the sysadmin tools would accept from the sysadmin, so only the role can stop it. */
export function sysadminForm(): FormData {
  const form = new FormData();

  for (const [name, value] of Object.entries({
    reason: "Visita duplicada",
    checkInId: "check-in",
    visitorId: "visitor",
    emails: "integrante@equipo.mx",
    email: "integrante@equipo.mx",
    name: "Puzzle",
    id: "",
    emailId: "email",
    enabled: "false",
  })) {
    form.set(name, value);
  }

  return form;
}
