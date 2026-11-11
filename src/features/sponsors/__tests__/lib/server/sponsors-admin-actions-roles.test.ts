/**
 * @jest-environment node
 */
import { deleteSponsorAction, saveSponsorAction } from "@features/sponsors/lib/sponsors-admin-actions";
import { expectRefused, otherRoleCases } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-41: only the sysadmin registers sponsors.
it.each(otherRoleCases({ saveSponsorAction, deleteSponsorAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);
