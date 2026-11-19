import type { PrismaClient } from "@generated/prisma/client";

const GUARD_TRIGGERS = ["accounts_keep_one_active_sysadmin_on_update", "accounts_keep_one_active_sysadmin_on_delete"];

/**
 * For the tests that wipe or disable every account as fixture reset: the database keeps one active sysadmin
 * (migration `accounts_admin`), so a suite about something else lifts that guard on its own temporary database first.
 * The tests of the guard itself never call this.
 */
export async function liftSysadminGuard(client: Pick<PrismaClient, "$executeRawUnsafe">): Promise<void> {
  for (const trigger of GUARD_TRIGGERS) {
    await client.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${trigger}"`);
  }
}
