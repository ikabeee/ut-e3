/**
 * @jest-environment node
 */
import { annulCheckInAction, excludeVisitorAction } from "@features/moderation/lib/moderation-actions";
import { expectRefused, otherRoleCases, signInAs, sysadminForm } from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-46: only the sysadmin annuls a visit or excludes a visitor.
it.each(otherRoleCases({ annulCheckInAction, excludeVisitorAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);

it("lets the sysadmin through with the same form, so the refusals come from the role", async () => {
  await signInAs("sysadmin");

  await expect(annulCheckInAction(null, sysadminForm())).resolves.toMatchObject({ status: "error" });
  await expect(excludeVisitorAction(null, sysadminForm())).resolves.toMatchObject({ status: "error" });
});
