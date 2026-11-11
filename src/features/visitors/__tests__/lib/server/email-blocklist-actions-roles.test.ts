/**
 * @jest-environment node
 */
import { addBlockedEmailsAction, removeBlockedEmailAction } from "@features/visitors/lib/email-blocklist-actions";
import { expectRefused, otherRoleCases } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-44: only the sysadmin manages the blocklist.
it.each(otherRoleCases({ addBlockedEmailsAction, removeBlockedEmailAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);

it("leaves the list empty after the refusals", async () => {
  await expect(getPrisma().emailBlocklist.count()).resolves.toBe(0);
});
