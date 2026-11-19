/**
 * @jest-environment node
 */
import type { PrismaClient } from "@generated/prisma/client";
import { readDatabaseMessage } from "@shared/lib/server/database-errors";
import { createTestClient, createTestDatabase, type TestDatabase } from "@shared/__tests__/lib/server/test-database";

let database: TestDatabase;

let prisma: PrismaClient;

let standCount = 0;

// Each test starts from an empty database of its own: the guard under test forbids wiping the accounts between tests.
beforeEach(() => {
  database = createTestDatabase();
  prisma = createTestClient(database);
});

afterEach(async () => {
  await prisma.$disconnect();
  database.remove();
});

describe("an active stand administrator with the secondary role sysadmin counts as a sysadmin (S2)", () => {
  it("is the last sysadmin once the primary sysadmin is disabled, and then cannot be disabled", async () => {
    const primary = await createSysadmin("primary");
    const dual = await createDualSysadmin("dual");

    await prisma.account.update({ where: { id: primary }, data: { status: "disabled" } });

    await expectRefusedByDatabase(prisma.account.update({ where: { id: dual }, data: { status: "disabled" } }));
    expect(await prisma.account.findUniqueOrThrow({ where: { id: dual } })).toMatchObject({ status: "active" });
  });

  it("protects the last sysadmin from losing the secondary role, whether it is removed or replaced", async () => {
    const dual = await createDualSysadmin("dual");

    await expectRefusedByDatabase(prisma.account.update({ where: { id: dual }, data: { secondaryRole: null } }));
    await expectRefusedByDatabase(prisma.account.update({ where: { id: dual }, data: { secondaryRole: "help_desk" } }));
    expect(await prisma.account.findUniqueOrThrow({ where: { id: dual } })).toMatchObject({
      secondaryRole: "sysadmin",
      status: "active",
    });
  });

  it("cannot be deleted when it is the last sysadmin", async () => {
    const dual = await createDualSysadmin("dual");

    await expectRefusedByDatabase(prisma.account.delete({ where: { id: dual } }));
    expect(await prisma.account.count()).toBe(1);
  });

  it("lets either one go while the other stays active", async () => {
    const primary = await createSysadmin("primary");
    const dual = await createDualSysadmin("dual");

    await prisma.account.update({ where: { id: dual }, data: { secondaryRole: null } });
    await prisma.account.update({ where: { id: dual }, data: { secondaryRole: "sysadmin" } });
    await prisma.account.update({ where: { id: primary }, data: { status: "disabled" } });
    await prisma.account.update({ where: { id: primary }, data: { status: "active" } });
    await prisma.account.delete({ where: { id: primary } });

    expect(await prisma.account.findUniqueOrThrow({ where: { id: dual } })).toMatchObject({
      secondaryRole: "sysadmin",
    });
  });

  it("does not count while the account is invited or disabled, so the primary sysadmin stays protected", async () => {
    const primary = await createSysadmin("primary");
    const invited = await createDualSysadmin("invited", "invited");
    const disabled = await createDualSysadmin("disabled", "disabled");

    await expectRefusedByDatabase(prisma.account.update({ where: { id: primary }, data: { status: "disabled" } }));
    await expectRefusedByDatabase(prisma.account.delete({ where: { id: primary } }));
    expect(await prisma.account.count({ where: { id: { in: [primary, invited, disabled] } } })).toBe(3);
  });

  it("keeps the rest of the account editable", async () => {
    const dual = await createDualSysadmin("dual");

    await prisma.account.update({ where: { id: dual }, data: { name: "Nuevo nombre" } });

    expect(await prisma.account.findUniqueOrThrow({ where: { id: dual } })).toMatchObject({ name: "Nuevo nombre" });
  });

  it("does not turn a stand administrator with another secondary role into a sysadmin", async () => {
    const primary = await createSysadmin("primary");

    await createDualSysadmin("help", "active", "help_desk");

    await expectRefusedByDatabase(prisma.account.update({ where: { id: primary }, data: { status: "disabled" } }));
  });
});

async function createSysadmin(local: string): Promise<string> {
  const created = await prisma.account.create({
    data: { email: `${local}@ut.mx`, name: local, role: "sysadmin", status: "active", password: "hash" },
    select: { id: true },
  });

  return created.id;
}

// A stand administrator needs its own stand: a stand takes one administrator.
async function createDualSysadmin(local: string, status = "active", secondaryRole = "sysadmin"): Promise<string> {
  standCount += 1;

  const stand = await prisma.stand.create({
    data: { zone: "A", number: standCount, studio: 1, groupCode: "101" },
    select: { id: true },
  });

  const created = await prisma.account.create({
    data: {
      email: `${local}@ut.mx`,
      name: local,
      role: "stand_admin",
      secondaryRole,
      standId: stand.id,
      status,
      password: status === "invited" ? null : "hash",
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
