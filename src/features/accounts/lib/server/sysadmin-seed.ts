import "server-only";
import type { AccountRole, AccountStatus } from "@features/accounts/lib/types";
import type { PrismaClient } from "@generated/prisma/client";
import { hashPassword } from "@shared/lib/server/password";

export type SysadminEnv = Readonly<Record<string, string | undefined>>;

const SYSADMIN_ROLE: AccountRole = "sysadmin";

const ACTIVE: AccountStatus = "active";

const MISSING_VARIABLES =
  "Seed: no se creó la cuenta del sysadmin porque faltan SYSADMIN_EMAIL, SYSADMIN_NAME o SYSADMIN_PASSWORD.";

const EMAIL_TAKEN = "Seed: no se creó la cuenta del sysadmin porque SYSADMIN_EMAIL ya pertenece a otra cuenta.";

// The credentials come from the environment so they never reach the repository; an existing sysadmin is never touched.
export async function seedSysadmin(prisma: PrismaClient, env: SysadminEnv): Promise<void> {
  if ((await prisma.account.count({ where: { role: SYSADMIN_ROLE } })) > 0) return;

  const email = env.SYSADMIN_EMAIL?.trim().toLowerCase();
  const name = env.SYSADMIN_NAME?.trim();
  const password = env.SYSADMIN_PASSWORD;

  if (!email || !name || !password?.trim()) {
    console.log(MISSING_VARIABLES);

    return;
  }

  if ((await prisma.account.count({ where: { email } })) > 0) {
    console.log(EMAIL_TAKEN);

    return;
  }

  await prisma.account.create({
    data: { email, name, role: SYSADMIN_ROLE, status: ACTIVE, password: await hashPassword(password) },
  });
}
