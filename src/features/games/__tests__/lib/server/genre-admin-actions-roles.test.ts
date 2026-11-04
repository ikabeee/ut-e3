/**
 * @jest-environment node
 */
import { deleteGenreAction, saveGenreAction } from "@features/games/lib/genre-admin-actions";
import { expectRefused, otherRoleCases } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-72: only the sysadmin manages the catalog of genres.
it.each(otherRoleCases({ saveGenreAction, deleteGenreAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);
