/**
 * @jest-environment node
 */
import { setSecondaryRole } from "@features/accounts/lib/server/account-admin";
import { listAllAccounts } from "@features/accounts/lib/server/account-admin-queries";
import { disableAccount, inviteAccount, type ManagingActor } from "@features/accounts/lib/server/invitations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-21T12:00:00.000Z");

const sysadmin: ManagingActor = { id: "", role: "sysadmin", standId: null };

// The event has at most 18 stands, so a test takes them from the start of a short list and every test frees them.
let nextStandNumber = 1;

let testNumber = 0;

beforeAll(async () => {
  sysadmin.id = await createAccount({ local: "root", role: "sysadmin" });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Accounts with an audit entry stay in the database, so each test uses emails of its own.
beforeEach(async () => {
  testNumber += 1;
  nextStandNumber = 1;
  await getPrisma().account.updateMany({ where: { role: "stand_admin" }, data: { status: "disabled" } });
});

describe("setSecondaryRole (S1, S2)", () => {
  it.each(["help_desk", "kof_admin", "raffle_admin", "sysadmin"])(
    "gives a stand administrator the secondary role %s and audits it",
    async (secondaryRole) => {
      const leader = await createStandAdmin("leader");

      expect(await setSecondaryRole(sysadmin, leader, secondaryRole)).toEqual({ status: "changed", secondaryRole });
      expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).secondaryRole).toBe(
        secondaryRole,
      );
      expect(await readAudit(leader)).toEqual([
        { actorId: sysadmin.id, action: "account.secondary_role", detail: { from: null, to: secondaryRole } },
      ]);
    },
  );

  it("replaces and removes the secondary role, recording where it came from", async () => {
    const leader = await createStandAdmin("leader");

    await setSecondaryRole(sysadmin, leader, "help_desk");

    expect(await setSecondaryRole(sysadmin, leader, "raffle_admin")).toEqual({
      status: "changed",
      secondaryRole: "raffle_admin",
    });
    expect(await setSecondaryRole(sysadmin, leader, null)).toEqual({ status: "changed", secondaryRole: null });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).secondaryRole).toBeNull();
    expect((await readAudit(leader)).map((entry) => entry.detail)).toEqual([
      { from: null, to: "help_desk" },
      { from: "help_desk", to: "raffle_admin" },
      { from: "raffle_admin", to: null },
    ]);
  });

  it("loads the role before the account is activated or after it was disabled", async () => {
    const invited = await createStandAdmin("invited", "invited");
    const disabled = await createStandAdmin("disabled", "disabled");

    expect((await setSecondaryRole(sysadmin, invited, "kof_admin")).status).toBe("changed");
    expect((await setSecondaryRole(sysadmin, disabled, "kof_admin")).status).toBe("changed");
  });

  it("answers unchanged, without an audit entry, when the account already has that role", async () => {
    const leader = await createStandAdmin("leader");

    expect(await setSecondaryRole(sysadmin, leader, null)).toEqual({ status: "unchanged" });

    await setSecondaryRole(sysadmin, leader, "help_desk");

    expect(await setSecondaryRole(sysadmin, leader, "help_desk")).toEqual({ status: "unchanged" });
    expect(await readAudit(leader)).toHaveLength(1);
  });

  it.each(["stand_staff", "sysadmin", "kof_admin", "kof_staff", "raffle_admin", "help_desk"])(
    "refuses a %s as the account to give it to and leaves it unchanged",
    async (role) => {
      const target = await createAccount({ local: `t${role}`, role, ...placeFor(role) });

      expect(await setSecondaryRole(sysadmin, target, "help_desk")).toEqual({ status: "notStandAdmin" });
      expect((await getPrisma().account.findUniqueOrThrow({ where: { id: target } })).secondaryRole).toBeNull();
      expect(await readAudit(target)).toEqual([]);
    },
  );

  it.each(["stand_admin", "stand_staff", "kof_staff", "root", "Sysadmin", " help_desk"])(
    "refuses %s as a secondary role and leaves the account unchanged",
    async (secondaryRole) => {
      const leader = await createStandAdmin("leader");

      expect(await setSecondaryRole(sysadmin, leader, secondaryRole)).toEqual({ status: "invalidRole" });
      expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).secondaryRole).toBeNull();
      expect(await readAudit(leader)).toEqual([]);
    },
  );

  it("answers notFound for an account that does not exist", async () => {
    expect(await setSecondaryRole(sysadmin, "missing", "help_desk")).toEqual({ status: "notFound" });
  });

  it.each([
    ["the KOF administrator", { id: "k", role: "kof_admin" }],
    ["a stand administrator", { id: "s", role: "stand_admin" }],
    [
      "a stand administrator with the secondary role kof_admin",
      { id: "s", role: "stand_admin", secondaryRole: "kof_admin" },
    ],
    ["the help desk", { id: "h", role: "help_desk" }],
  ])("is not available to %s", async (_case, actor) => {
    const leader = await createStandAdmin("leader");

    expect(await setSecondaryRole(actor, leader, "sysadmin")).toEqual({ status: "forbidden" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).secondaryRole).toBeNull();
    expect(await readAudit(leader)).toEqual([]);
  });

  it("keeps the last active sysadmin: its secondary role sysadmin cannot be removed or replaced", async () => {
    const leader = await createStandAdmin("leader", "active", "sysadmin");

    await leaveActive([leader]);

    expect(await setSecondaryRole(sysadmin, leader, null)).toEqual({ status: "lastSysadmin" });
    expect(await setSecondaryRole(sysadmin, leader, "help_desk")).toEqual({ status: "lastSysadmin" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).secondaryRole).toBe("sysadmin");
    expect(await readAudit(leader)).toEqual([]);

    await restoreParked();
  });

  it("lets a secondary sysadmin lose the role while another sysadmin is active", async () => {
    const leader = await createStandAdmin("leader", "active", "sysadmin");

    expect(await setSecondaryRole(sysadmin, leader, null)).toEqual({ status: "changed", secondaryRole: null });
  });
});

describe("a secondary sysadmin counts as a sysadmin when disabling (S2)", () => {
  it("is protected against disabling itself", async () => {
    const leader = await createStandAdmin("leader", "active", "sysadmin");

    expect(await disableAccount({ id: leader, role: "sysadmin" }, leader)).toEqual({ status: "selfProtected" });
  });

  it("can be disabled while another sysadmin is active", async () => {
    const leader = await createStandAdmin("leader", "active", "sysadmin");

    expect(await disableAccount(sysadmin, leader)).toEqual({ status: "disabled" });
  });

  it("is the last active sysadmin when the primary sysadmins are gone, so nobody can disable it", async () => {
    const leader = await createStandAdmin("leader", "active", "sysadmin");

    await leaveActive([leader]);

    expect(await disableAccount(sysadmin, leader)).toEqual({ status: "lastSysadmin" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leader } })).status).toBe("active");

    await restoreParked();
  });

  it("lets the primary sysadmin be disabled when the secondary one keeps the system administrable", async () => {
    const other = await createAccount({ local: "other-root", role: "sysadmin" });

    const leader = await createStandAdmin("leader", "active", "sysadmin");

    await leaveActive([other, leader]);

    expect(await disableAccount(sysadmin, other)).toEqual({ status: "disabled" });

    await restoreParked();
  });
});

describe("a secondary KOF administrator invites KOF staff (L14)", () => {
  it("invites and disables KOF staff, and keeps managing the staff of its own stand", async () => {
    const stand = await createStand();
    const actor: ManagingActor = { id: "", role: "stand_admin", secondaryRole: "kof_admin", standId: stand };

    actor.id = await createAccount({ local: "dual", role: "stand_admin", standId: stand, secondaryRole: "kof_admin" });

    const kofStaff = { name: "Luis", email: mail("kst"), role: "kof_staff", kofDesk: 1 as const, standId: null };
    const standStaff = { name: "Eva", email: mail("sst"), role: "stand_staff", kofDesk: null, standId: null };

    const invitedKof = await inviteAccount(actor, kofStaff, NOW);

    expect(invitedKof.status).toBe("invited");
    expect((await inviteAccount(actor, standStaff, NOW)).status).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("sst") } })).toMatchObject({
      standId: stand,
    });

    if (invitedKof.status !== "invited") throw new Error("the KOF staff was not invited");

    expect(await disableAccount(actor, invitedKof.accountId)).toEqual({ status: "disabled" });
  });

  it("does not invite any other role", async () => {
    const stand = await createStand();
    const actor: ManagingActor = { id: "", role: "stand_admin", secondaryRole: "kof_admin", standId: stand };

    actor.id = await createAccount({ local: "dual", role: "stand_admin", standId: stand, secondaryRole: "kof_admin" });

    for (const role of ["sysadmin", "kof_admin", "help_desk", "raffle_admin", "stand_admin"]) {
      expect(
        await inviteAccount(actor, { name: "X", email: mail(`x${role}`), role, kofDesk: null, standId: null }, NOW),
      ).toEqual({ status: "forbidden" });
    }
  });

  it.each(["help_desk", "raffle_admin"])("gives a secondary %s no right to invite KOF staff", async (secondaryRole) => {
    const stand = await createStand();
    const actor: ManagingActor = { id: "dual", role: "stand_admin", secondaryRole, standId: stand };
    const kofStaff = { name: "Luis", email: mail("kst"), role: "kof_staff", kofDesk: 2 as const, standId: null };

    expect(await inviteAccount(actor, kofStaff, NOW)).toEqual({ status: "forbidden" });
  });
});

describe("a secondary sysadmin invites like the sysadmin from /admin/accounts (S2)", () => {
  async function createDualSysadmin(): Promise<{ actor: ManagingActor; stand: string }> {
    const stand = await createStand();
    const id = await createAccount({ local: "dual", role: "stand_admin", standId: stand, secondaryRole: "sysadmin" });

    return { actor: { id, role: "stand_admin", secondaryRole: "sysadmin", standId: stand }, stand };
  }

  it("names the stand of an administrator and invites any role", async () => {
    const { actor } = await createDualSysadmin();
    const other = await createStand();
    const base = { kofDesk: null, standId: null };

    expect((await inviteAccount(actor, { ...base, name: "A", email: mail("a"), role: "help_desk" }, NOW)).status).toBe(
      "invited",
    );
    expect(
      (await inviteAccount(actor, { ...base, name: "B", email: mail("b"), role: "stand_admin", standId: other }, NOW))
        .status,
    ).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("b") } })).toMatchObject({
      standId: other,
    });
  });

  it("invites the staff of its own stand when the form names no stand, as it does from /stand/team", async () => {
    const { actor, stand } = await createDualSysadmin();
    const input = { name: "Eva", email: mail("eva"), role: "stand_staff", kofDesk: null, standId: null };

    expect((await inviteAccount(actor, input, NOW)).status).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("eva") } })).toMatchObject({
      standId: stand,
    });
  });
});

describe("listAllAccounts", () => {
  it("shows the secondary role of each account, or null", async () => {
    await createStandAdmin("with", "active", "help_desk");
    await createStandAdmin("without");

    const rows = await listAllAccounts({ search: `t${testNumber}` });

    expect(rows.find((row) => row.email === mail("with"))?.secondaryRole).toBe("help_desk");
    expect(rows.find((row) => row.email === mail("without"))?.secondaryRole).toBeNull();
  });
});

async function createStandAdmin(local: string, status = "active", secondaryRole?: string): Promise<string> {
  return createAccount({ local, role: "stand_admin", status, standId: await createStand(), secondaryRole });
}

// A role that needs a stand or a desk gets the one that the CHECKs ask for.
function placeFor(role: string) {
  if (role === "kof_staff") return { kofDesk: 2 };

  return role === "stand_staff" ? { standId: createStand() } : {};
}

async function createAccount(account: {
  local: string;
  role: string;
  status?: string;
  standId?: string | Promise<string>;
  kofDesk?: number;
  secondaryRole?: string;
}): Promise<string> {
  const status = account.status ?? "active";

  const created = await getPrisma().account.create({
    data: {
      email: mail(account.local),
      name: "Cuenta",
      role: account.role,
      secondaryRole: account.secondaryRole,
      status,
      password: status === "invited" ? null : "hash",
      standId: await account.standId,
      kofDesk: account.kofDesk,
      createdAt: NOW,
    },
    select: { id: true },
  });

  return created.id;
}

async function createStand(): Promise<string> {
  const number = nextStandNumber;

  nextStandNumber += 1;

  const stand = await getPrisma().stand.upsert({
    where: { zone_number: { zone: "A", number } },
    update: {},
    create: { zone: "A", number, studio: 1, groupCode: "101" },
    select: { id: true },
  });

  return stand.id;
}

const parked: string[] = [];

// The other accounts that count as an active sysadmin are disabled for the test (the one to keep stays active, so the
// guard of the database lets it happen), and `restoreParked` activates them again.
async function leaveActive(keep: string[]): Promise<void> {
  const others = await getPrisma().account.findMany({
    where: { status: "active", id: { notIn: keep }, OR: [{ role: "sysadmin" }, { secondaryRole: "sysadmin" }] },
    select: { id: true },
  });

  parked.push(...others.map((row) => row.id));
  await getPrisma().account.updateMany({ where: { id: { in: parked } }, data: { status: "disabled" } });
}

async function restoreParked(): Promise<void> {
  await getPrisma().account.updateMany({ where: { id: { in: parked } }, data: { status: "active" } });
  parked.length = 0;
}

async function readAudit(entityId: string) {
  const entries = await getPrisma().auditLog.findMany({ where: { entityId }, orderBy: { createdAt: "asc" } });

  return entries.map(({ actorId, action, detail }) => ({ actorId, action, detail }));
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}
