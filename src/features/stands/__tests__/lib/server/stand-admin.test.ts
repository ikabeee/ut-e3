/**
 * @jest-environment node
 */
import { disableAccount } from "@features/accounts/lib/server/invitations";
import { listAdminStands } from "@features/stands/lib/server/stand-admin-queries";
import { toStandZone } from "@features/stands/lib/stand-zones";
import { createStand, inviteStandAdmin, updateStand } from "@features/stands/lib/server/stand-admin-mutations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-02T12:00:00.000Z");

const FIELDS = { zone: "A", number: 1, studio: 6, groupCode: "101" } as const;

let sysadminId = "";

let testNumber = 0;

beforeAll(async () => {
  sysadminId = (
    await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Accounts with an audit entry cannot be deleted, so every test works on stands and emails of its own.
beforeEach(async () => {
  testNumber += 1;
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().session.deleteMany();
  await getPrisma().accountInvitation.deleteMany();
  await getPrisma().stand.deleteMany({ where: { accounts: { none: {} }, game: null } });
});

describe("createStand (RF-39)", () => {
  it("creates the stand, its administrator, the invitation and the audit entries together", async () => {
    const result = await createStand(request({ zone: "T", number: 5 }));

    expect(result).toEqual({ status: "created", standId: expect.any(String), emailId: expect.any(String) });

    const stand = await getPrisma().stand.findUniqueOrThrow({ where: { zone_number: { zone: "T", number: 5 } } });
    const admin = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });

    const entries = await getPrisma().auditLog.findMany({
      where: { entityId: { in: [stand.id, admin.id] } },
      orderBy: { createdAt: "asc" },
    });

    expect(stand).toMatchObject({ studio: 6, groupCode: "101" });
    expect(admin).toMatchObject({ role: "stand_admin", status: "invited", standId: stand.id, createdById: sysadminId });
    expect(await getPrisma().accountInvitation.count({ where: { accountId: admin.id } })).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
    expect(entries.map((entry) => entry.action).toSorted()).toEqual(["account.invite", "stand.create"]);
    expect(entries.every((entry) => entry.actorId === sysadminId)).toBe(true);
    expect(JSON.stringify(entries.map((entry) => entry.detail))).not.toContain(mail("ana"));
  });

  it("writes nothing when the stand already exists", async () => {
    await createStand(request({ zone: "T", number: 1 }));

    const result = await createStand(request({ zone: "T", number: 1, email: "otra" }));

    expect(result).toEqual({ status: "standTaken" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("otra") } })).toBeNull();
  });

  it("writes nothing when the email already has an account", async () => {
    await createStand(request({ zone: "A", number: 1 }));

    const result = await createStand(request({ zone: "A", number: 2 }));

    expect(result).toEqual({ status: "emailTaken" });
    expect(await getPrisma().stand.findUnique({ where: { zone_number: { zone: "A", number: 2 } } })).toBeNull();
  });

  it("refuses the email of a visitor with a passport", async () => {
    await getPrisma().visitor.create({
      data: {
        fullName: "Visitante",
        gamertag: `Visitante${testNumber}`,
        email: mail("visitor"),
        pin: "x",
        pinLookup: `lookup-${testNumber}`,
      },
    });

    expect(await createStand(request({ zone: "T", number: 3, email: "visitor" }))).toEqual({ status: "hasPassport" });
    expect(await getPrisma().stand.findUnique({ where: { zone_number: { zone: "T", number: 3 } } })).toBeNull();
  });

  it("refuses the stand that would be number 19 (RN-01)", async () => {
    const count = await getPrisma().stand.count();

    for (let number = count; number < 18; number += 1) {
      await getPrisma().stand.create({ data: { zone: "C", number: 100 + number, studio: 1, groupCode: "X" } });
    }

    expect(await createStand(request({ zone: "T", number: 4 }))).toEqual({ status: "limitReached" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("ana") } })).toBeNull();

    await getPrisma().stand.deleteMany({ where: { zone: "C", number: { gte: 100 } } });
  });
});

describe("updateStand", () => {
  it("changes the data of the stand and audits the old and the new values", async () => {
    const created = await createStand(request({ zone: "C", number: 1 }));
    const standId = created.status === "created" ? created.standId : "";

    const result = await updateStand({
      actor: { id: sysadminId },
      standId,
      fields: { zone: "C", number: 2, studio: 9, groupCode: "202" },
    });

    const entry = await getPrisma().auditLog.findFirstOrThrow({ where: { action: "stand.update", entityId: standId } });

    expect(result).toEqual({ status: "updated" });
    expect(await getPrisma().stand.findUniqueOrThrow({ where: { id: standId } })).toMatchObject({
      zone: "C",
      number: 2,
      studio: 9,
      groupCode: "202",
    });
    expect(entry.detail).toEqual({
      before: { zone: "C", number: 1, studio: 6, groupCode: "101" },
      after: { zone: "C", number: 2, studio: 9, groupCode: "202" },
    });
  });

  it("keeps the game, the accounts and the history of the stand", async () => {
    const created = await createStand(request({ zone: "C", number: 3 }));
    const standId = created.status === "created" ? created.standId : "";

    await updateStand({
      actor: { id: sysadminId },
      standId,
      fields: { zone: "D", number: 1, studio: 2, groupCode: "A" },
    });

    expect(await getPrisma().account.count({ where: { standId } })).toBe(1);
  });

  it("refuses a zone and number that another stand has, and a stand that does not exist", async () => {
    await createStand(request({ zone: "B", number: 1 }));

    const other = await createStand(request({ zone: "B", number: 2, email: "otro" }));
    const otherId = other.status === "created" ? other.standId : "";
    const same = { zone: "B", number: 1, studio: 1, groupCode: "A" } as const;

    expect(await updateStand({ actor: { id: sysadminId }, standId: otherId, fields: same })).toEqual({
      status: "standTaken",
    });
    expect(await updateStand({ actor: { id: sysadminId }, standId: "missing", fields: same })).toEqual({
      status: "notFound",
    });
  });
});

describe("inviteStandAdmin", () => {
  it("refuses a second administrator while the stand has one", async () => {
    const standId = await createStandAndGetId({ zone: "D", number: 2 });

    const result = await inviteStandAdmin({
      actor: { id: sysadminId },
      standId,
      admin: { name: "Luis", email: mail("luis") },
      now: NOW,
    });

    expect(result).toEqual({ status: "adminExists" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("luis") } })).toBeNull();
  });

  it("invites a new administrator once the previous one is disabled", async () => {
    const standId = await createStandAndGetId({ zone: "D", number: 3 });
    const previous = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });

    expect(await disableAccount({ id: sysadminId, role: "sysadmin" }, previous.id)).toEqual({ status: "disabled" });

    const result = await inviteStandAdmin({
      actor: { id: sysadminId },
      standId,
      admin: { name: "Luis", email: mail("luis") },
      now: NOW,
    });

    expect(result.status).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("luis") } })).toMatchObject({
      role: "stand_admin",
      standId,
    });
  });

  it("refuses a stand that does not exist", async () => {
    const result = await inviteStandAdmin({
      actor: { id: sysadminId },
      standId: "missing",
      admin: { name: "Luis", email: mail("luis") },
      now: NOW,
    });

    expect(result).toEqual({ status: "notFound" });
  });
});

describe("listAdminStands (RF-38)", () => {
  it("lists the stands with the full code, the game, the administrators and the staff in use", async () => {
    const standId = await createStandAndGetId({ zone: "B", number: 3 });

    for (const [index, status] of ["invited", "active", "disabled"].entries()) {
      await getPrisma().account.create({
        data: {
          email: mail(`staff${index}`),
          name: "Staff",
          role: "stand_staff",
          status,
          standId,
          password: "hash",
        },
      });
    }

    const stands = await listAdminStands();
    const stand = stands.find((item) => item.id === standId);

    expect(stand).toMatchObject({ code: "ZB-S3-E6-101", gameName: null, activeStaff: 2 });
    expect(stand?.admins.map((admin) => admin.email)).toEqual([mail("ana")]);
  });

  it("orders the stands by zone and number", async () => {
    await createStandAndGetId({ zone: "T", number: 2 });
    await createStandAndGetId({ zone: "A", number: 3, email: "otra" });

    const codes = (await listAdminStands()).map((stand) => `${stand.zone}${stand.number}`);

    expect(codes).toEqual(codes.toSorted());
  });
});

async function createStandAndGetId(overrides: { zone?: string; number?: number; email?: string }) {
  const result = await createStand(request(overrides));

  if (result.status !== "created") throw new Error(`The stand was not created: ${result.status}`);

  return result.standId;
}

function request(overrides: { zone?: string; number?: number; email?: string } = {}) {
  const { zone = FIELDS.zone, number = FIELDS.number, email = "ana" } = overrides;

  return {
    actor: { id: sysadminId },
    fields: { ...FIELDS, zone: toStandZone(zone) ?? "A", number },
    admin: { name: "Ana Pérez", email: mail(email) },
    now: NOW,
  };
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}
