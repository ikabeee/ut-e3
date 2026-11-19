/**
 * @jest-environment node
 */
import { disableAccount } from "@features/accounts/lib/server/invitations";
import { readDatabaseMessage } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let sysadminCount = 0;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The tests run in order and each starts from what the one before left: the race leaves one active sysadmin.
describe("the last active sysadmin", () => {
  it("is kept when two sysadmins disable each other at the same time", async () => {
    const first = await createSysadmin("first");
    const second = await createSysadmin("second");

    const results = await Promise.all([
      disableAccount({ id: first, role: "sysadmin" }, second),
      disableAccount({ id: second, role: "sysadmin" }, first),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["disabled", "lastSysadmin"]);
    expect(await getPrisma().account.count({ where: { role: "sysadmin", status: "active" } })).toBe(1);
  });

  it("is protected by the database against a status or role change, even outside the application", async () => {
    const lone = await findOnlyActiveSysadmin();

    await expectRefusedByDatabase(getPrisma().account.update({ where: { id: lone }, data: { status: "disabled" } }));
    await expectRefusedByDatabase(getPrisma().account.update({ where: { id: lone }, data: { role: "help_desk" } }));
    expect(await getPrisma().account.findUniqueOrThrow({ where: { id: lone } })).toMatchObject({
      role: "sysadmin",
      status: "active",
    });
  });

  it("cannot be deleted, but a sysadmin can leave while another one is active", async () => {
    const lone = await findOnlyActiveSysadmin();

    await expectRefusedByDatabase(getPrisma().account.delete({ where: { id: lone } }));

    const other = await createSysadmin("other");

    await getPrisma().account.update({ where: { id: other }, data: { role: "help_desk" } });

    expect(await findOnlyActiveSysadmin()).toBe(lone);

    const replacement = await createSysadmin("replacement");

    await getPrisma().account.update({ where: { id: lone }, data: { status: "disabled" } });

    expect(await findOnlyActiveSysadmin()).toBe(replacement);
  });
});

async function findOnlyActiveSysadmin(): Promise<string> {
  const active = await getPrisma().account.findMany({
    where: { role: "sysadmin", status: "active" },
    select: { id: true },
  });

  expect(active).toHaveLength(1);

  return active[0].id;
}

async function createSysadmin(local: string): Promise<string> {
  sysadminCount += 1;

  const created = await getPrisma().account.create({
    data: {
      email: `${local}${sysadminCount}@ut.mx`,
      name: local,
      role: "sysadmin",
      status: "active",
      password: "hash",
    },
    select: { id: true },
  });

  return created.id;
}

// Prisma wraps the message of the trigger, so it is read the way the application reads it.
async function expectRefusedByDatabase(change: Promise<unknown>): Promise<void> {
  const failure = await change.then(
    () => null,
    (cause: unknown) => cause,
  );

  expect(readDatabaseMessage(failure)).toContain("last_sysadmin");
}
