/**
 * @jest-environment node
 */
import {
  disableAccount,
  inviteAccount,
  reactivateAccount,
  type ManagingActor,
} from "@features/accounts/lib/server/invitations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-02T12:00:00.000Z");

const actors = {
  sysadmin: { id: "", role: "sysadmin", standId: null } satisfies ManagingActor,
  kofAdmin: { id: "", role: "kof_admin", standId: null } satisfies ManagingActor,
  standAdmin: { id: "", role: "stand_admin", standId: "" } satisfies ManagingActor,
  otherAdmin: { id: "", role: "stand_admin", standId: "" } satisfies ManagingActor,
};

let testNumber = 0;

beforeAll(async () => {
  const stand = await createStand(1);
  const otherStand = await createStand(2);

  actors.sysadmin.id = await createActiveAccount({ email: "sysadmin@ut.mx", role: "sysadmin" });
  actors.kofAdmin.id = await createActiveAccount({ email: "kof-admin@ut.mx", role: "kof_admin" });
  actors.standAdmin.standId = stand;
  actors.standAdmin.id = await createActiveAccount({ email: "admin-1@ut.mx", role: "stand_admin", standId: stand });
  actors.otherAdmin.standId = otherStand;
  actors.otherAdmin.id = await createActiveAccount({
    email: "admin-2@ut.mx",
    role: "stand_admin",
    standId: otherStand,
  });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Accounts with an audit entry cannot be deleted, so every test frees the places by disabling what it created.
beforeEach(async () => {
  testNumber += 1;
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().account.updateMany({
    where: { role: { in: ["stand_staff", "kof_staff"] } },
    data: { status: "disabled" },
  });
});

describe("reactivateAccount", () => {
  it("returns a disabled account to invited with a new link, erases its password and audits it", async () => {
    const id = await createDisabledStaff("ana");

    await getPrisma().account.update({ where: { id }, data: { password: "hash" } });

    const result = await reactivateAccount(actors.standAdmin, id, NOW);

    expect(result).toEqual({ status: "reactivated", emailId: expect.any(String) });
    await expect(getPrisma().account.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
      status: "invited",
      password: null,
    });
    await expect(getPrisma().accountInvitation.count({ where: { accountId: id, usedAt: null } })).resolves.toBe(1);
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(2);
    await expect(getPrisma().auditLog.count({ where: { action: "account.reactivate", entityId: id } })).resolves.toBe(
      1,
    );
    await expect(
      getPrisma().auditLog.findFirstOrThrow({ where: { action: "account.reactivate", entityId: id } }),
    ).resolves.toMatchObject({ actorId: actors.standAdmin.id, detail: {} });
  });

  it("does not touch an account that is not disabled", async () => {
    const id = await createDisabledStaff("luis");

    await reactivateAccount(actors.standAdmin, id, NOW);

    await expect(reactivateAccount(actors.standAdmin, id, NOW)).resolves.toEqual({ status: "wrongState" });
  });

  it("refuses the administrator of another stand and roles it does not manage", async () => {
    const id = await createDisabledStaff("eva");

    await expect(reactivateAccount(actors.otherAdmin, id, NOW)).resolves.toEqual({ status: "forbidden" });
    await expect(reactivateAccount(actors.kofAdmin, id, NOW)).resolves.toEqual({ status: "forbidden" });
    await expect(reactivateAccount(actors.standAdmin, "no-existe", NOW)).resolves.toEqual({ status: "notFound" });
    await expect(getPrisma().account.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
      status: "disabled",
    });
  });

  it("keeps the limit of 3 staff per stand", async () => {
    const ids = [
      await createDisabledStaff("uno"),
      await createDisabledStaff("dos"),
      await createDisabledStaff("tres"),
      await createDisabledStaff("cuatro"),
    ];

    for (const id of ids.slice(0, 3)) {
      expect((await reactivateAccount(actors.standAdmin, id, NOW)).status).toBe("reactivated");
    }

    await expect(reactivateAccount(actors.standAdmin, ids[3], NOW)).resolves.toEqual({ status: "standFull" });
    await expect(getPrisma().account.findUniqueOrThrow({ where: { id: ids[3] } })).resolves.toMatchObject({
      status: "disabled",
    });

    await disableAccount(actors.standAdmin, ids[0]);

    await expect(reactivateAccount(actors.standAdmin, ids[3], NOW)).resolves.toMatchObject({ status: "reactivated" });
  });

  it("keeps one staff per KOF desk", async () => {
    const first = await createDisabledKofStaff("mesa-a", 1);
    const second = await createDisabledKofStaff("mesa-b", 1);

    await expect(reactivateAccount(actors.kofAdmin, first, NOW)).resolves.toMatchObject({ status: "reactivated" });
    await expect(reactivateAccount(actors.kofAdmin, second, NOW)).resolves.toEqual({ status: "deskTaken" });
  });

  it("lets the sysadmin reactivate a stand administrator only if the stand has none active", async () => {
    const standId = actors.standAdmin.standId ?? "";
    const old = await createAccount({ email: "viejo-admin@ut.mx", role: "stand_admin", standId, status: "disabled" });

    await expect(reactivateAccount(actors.sysadmin, old, NOW)).resolves.toEqual({ status: "adminTaken" });

    await getPrisma().account.update({ where: { id: actors.standAdmin.id }, data: { status: "disabled" } });

    await expect(reactivateAccount(actors.sysadmin, old, NOW)).resolves.toMatchObject({ status: "reactivated" });
    await getPrisma().account.update({ where: { id: old }, data: { status: "disabled" } });
    await getPrisma().account.update({ where: { id: actors.standAdmin.id }, data: { status: "active" } });
  });

  it("makes the email usable again: it could not be invited twice, and now the same account comes back", async () => {
    const id = await createDisabledStaff("repetido");

    await expect(inviteAccount(actors.standAdmin, invite("repetido"), NOW)).resolves.toEqual({ status: "emailTaken" });
    await expect(reactivateAccount(actors.standAdmin, id, NOW)).resolves.toMatchObject({ status: "reactivated" });
  });
});

async function createDisabledStaff(name: string): Promise<string> {
  const result = await inviteAccount(actors.standAdmin, invite(name), NOW);

  if (result.status !== "invited") throw new Error(`The invitation of ${name} was refused: ${result.status}`);

  await disableAccount(actors.standAdmin, result.accountId);

  return result.accountId;
}

async function createDisabledKofStaff(name: string, desk: number): Promise<string> {
  return createAccount({ email: mail(name), role: "kof_staff", kofDesk: desk, status: "disabled" });
}

function invite(name: string) {
  return { name, email: mail(name), role: "stand_staff", kofDesk: null } as const;
}

function mail(name: string): string {
  return `${name}-${testNumber}@ut.mx`;
}

async function createStand(number: number): Promise<string> {
  const stand = await getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });

  return stand.id;
}

async function createActiveAccount(data: { email: string; role: string; standId?: string }): Promise<string> {
  return createAccount({ ...data, status: "active", password: "hash" });
}

async function createAccount(data: {
  email: string;
  role: string;
  standId?: string;
  kofDesk?: number;
  status: string;
  password?: string;
}): Promise<string> {
  const account = await getPrisma().account.create({ data: { name: data.email, ...data } });

  return account.id;
}
