/**
 * @jest-environment node
 */
import { saveEventSettingsAction } from "@features/event-settings/lib/event-settings-actions";
import { expectRefused, otherRoleCases } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-43: only the sysadmin edits event_settings.
it.each(otherRoleCases({ saveEventSettingsAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);
