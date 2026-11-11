/**
 * @jest-environment node
 */
import {
  disableAccount,
  inviteAccount,
  listStandAccounts,
  resendInvitation,
  type ManagingActor,
} from "@features/accounts/lib/server/invitations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-02T12:00:00.000Z");

const actors = {
  sysadmin: { id: "", role: "sysadmin", standId: null } satisfies ManagingActor,
  standAdmin: { id: "", role: "stand_admin", standId: "" } satisfies ManagingActor,
  otherAdmin: { id: "", role: "stand_admin", standId: "" } satisfies ManagingActor,
};

let testNumber = 0;

beforeAll(async () => {
  const [stand, otherStand] = await Promise.all([createStand(1), createStand(2)]);

  actors.sysadmin.id = await createActiveAccount({ email: "sysadmin@ut.mx", role: "sysadmin" });
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

// Accounts with an audit entry cannot be deleted, so every test frees the places by disabling the staff it created.
beforeEach(async () => {
  testNumber += 1;
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().account.updateMany({ where: { role: "stand_staff" }, data: { status: "disabled" } });
});

describe("a stand administrator inviting staff (RF-32)", () => {
  it("creates the staff account in the stand of the administrator and audits it", async () => {
    const result = await inviteAccount(actors.standAdmin, invite("ana"), NOW);

    expect(result.status).toBe("invited");

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "account.invite", entityId: account.id },
    });

    expect(account).toMatchObject({
      role: "stand_staff",
      status: "invited",
      standId: actors.standAdmin.standId,
      createdById: actors.standAdmin.id,
    });
    expect(entry.actorId).toBe(actors.standAdmin.id);
    expect(entry.detail).toEqual({ role: "stand_staff", kofDesk: null, standId: actors.standAdmin.standId });
  });

  it("allows 3 staff accounts and refuses the 4th until one is disabled", async () => {
    for (const name of ["uno", "dos", "tres"]) {
      expect((await inviteAccount(actors.standAdmin, invite(name), NOW)).status).toBe("invited");
    }

    expect(await inviteAccount(actors.standAdmin, invite("cuatro"), NOW)).toEqual({ status: "standFull" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("cuatro") } })).toBeNull();

    const first = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("uno") } });

    expect((await disableAccount(actors.standAdmin, first.id)).status).toBe("disabled");
    expect((await inviteAccount(actors.standAdmin, invite("cuatro"), NOW)).status).toBe("invited");
  });

  it("counts the places per stand", async () => {
    for (const name of ["uno", "dos", "tres"]) await inviteAccount(actors.standAdmin, invite(name), NOW);

    expect((await inviteAccount(actors.otherAdmin, invite("otro"), NOW)).status).toBe("invited");
  });

  it("does not accept any role but the staff of the stand", async () => {
    for (const role of ["stand_admin", "kof_admin", "sysadmin"]) {
      expect(await inviteAccount(actors.standAdmin, { ...invite(role), role }, NOW)).toEqual({ status: "forbidden" });
    }
  });

  it("refuses an administrator that has no stand", async () => {
    const result = await inviteAccount({ ...actors.standAdmin, standId: null }, invite("ana"), NOW);

    expect(result).toEqual({ status: "forbidden" });
  });

  it("does not let the sysadmin invite stand staff", async () => {
    expect(await inviteAccount(actors.sysadmin, invite("ana"), NOW)).toEqual({ status: "forbidden" });
  });
});

describe("managing the staff of a stand", () => {
  it("lets the administrator resend and disable its own staff, which closes their sessions", async () => {
    const staffId = await inviteAndGetId(actors.standAdmin, "ana");

    expect((await resendInvitation(actors.standAdmin, staffId, NOW)).status).toBe("sent");

    await getPrisma().session.create({ data: { accountId: staffId, token: `t${testNumber}`, expiresAt: NOW } });

    expect(await disableAccount(actors.standAdmin, staffId)).toEqual({ status: "disabled" });
    expect(await getPrisma().session.count({ where: { accountId: staffId } })).toBe(0);
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: staffId } })).status).toBe("disabled");
    expect(await getPrisma().auditLog.count({ where: { action: "account.disable", entityId: staffId } })).toBe(1);
  });

  it("does not let an administrator touch the staff of another stand", async () => {
    const staffId = await inviteAndGetId(actors.standAdmin, "ana");

    expect(await disableAccount(actors.otherAdmin, staffId)).toEqual({ status: "forbidden" });
    expect(await resendInvitation(actors.otherAdmin, staffId, NOW)).toEqual({ status: "forbidden" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: staffId } })).status).toBe("invited");
  });

  it("lets the sysadmin disable a stand administrator but not the staff", async () => {
    const staffId = await inviteAndGetId(actors.standAdmin, "ana");

    expect(await disableAccount(actors.sysadmin, staffId)).toEqual({ status: "forbidden" });

    const adminId = await createActiveAccount({
      email: `${mail("temp-admin")}`,
      role: "stand_admin",
      standId: await createStand(3),
    });

    expect(await disableAccount(actors.sysadmin, adminId)).toEqual({ status: "disabled" });
  });
});

describe("listStandAccounts", () => {
  it("lists only the staff of the stand asked for, whatever their status", async () => {
    await inviteAccount(actors.standAdmin, invite("ana"), NOW);
    await inviteAccount(actors.otherAdmin, invite("luis"), NOW);

    const rows = await listStandAccounts({ role: "stand_staff", standId: actors.standAdmin.standId });

    expect(rows.map((row) => row.email)).toContain(mail("ana"));
    expect(rows.map((row) => row.email)).not.toContain(mail("luis"));
    expect(rows.every((row) => row.standId === actors.standAdmin.standId)).toBe(true);
  });

  it("lists the administrators of every stand when no stand is given", async () => {
    const rows = await listStandAccounts({ role: "stand_admin" });

    expect(rows.map((row) => row.standId)).toEqual(
      expect.arrayContaining([actors.standAdmin.standId, actors.otherAdmin.standId]),
    );
  });
});

describe("the limits in the database", () => {
  it("refuses a 4th staff account written without the application", async () => {
    const standId = await createStand(4);

    for (const name of ["a", "b", "c"]) {
      await createActiveAccount({ email: `${mail(name)}`, role: "stand_staff", standId });
    }

    await expect(createActiveAccount({ email: mail("d"), role: "stand_staff", standId })).rejects.toThrow();
  });

  it("refuses a second active administrator for a stand and allows it once the first is disabled", async () => {
    const standId = await createStand(5);
    const firstId = await createActiveAccount({ email: mail("first"), role: "stand_admin", standId });

    await expect(createActiveAccount({ email: mail("second"), role: "stand_admin", standId })).rejects.toThrow();

    await getPrisma().account.update({ where: { id: firstId }, data: { status: "disabled" } });

    await expect(createActiveAccount({ email: mail("second"), role: "stand_admin", standId })).resolves.toEqual(
      expect.any(String),
    );
  });
});

async function inviteAndGetId(actor: ManagingActor, local: string): Promise<string> {
  await inviteAccount(actor, invite(local), NOW);

  return (await getPrisma().account.findUniqueOrThrow({ where: { email: mail(local) } })).id;
}

function invite(local: string) {
  return { name: "Ana Pérez", email: mail(local), role: "stand_staff", kofDesk: null };
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

async function createStand(number: number): Promise<string> {
  const stand = await getPrisma().stand.create({ data: { zone: "B", number, studio: 1, groupCode: "101" } });

  return stand.id;
}

async function createActiveAccount(account: { email: string; role: string; standId?: string }): Promise<string> {
  const created = await getPrisma().account.create({
    data: { ...account, name: account.email, status: "active", password: "scrypt$1$1$1$a$b" },
  });

  return created.id;
}
