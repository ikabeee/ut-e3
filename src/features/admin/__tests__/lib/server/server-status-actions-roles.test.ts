/**
 * @jest-environment node
 */
import { resendEmailAction, setPublicBracketBySysadminAction } from "@features/admin/lib/server-status-actions";
import { expectRefused, otherRoleCases } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-73 and RF-74: only the sysadmin resends from the outbox or closes the bracket from the server status.
it.each(otherRoleCases({ resendEmailAction, setPublicBracketBySysadminAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);
