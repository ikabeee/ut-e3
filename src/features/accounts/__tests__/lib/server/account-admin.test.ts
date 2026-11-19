/**
 * @jest-environment node
 */
import { MAX_STAND_STAFF } from "@features/accounts/lib/invitation-rules";
import {
  clearPendingLoginChallenges,
  closeAccountSessions,
  sendAdminPasswordReset,
} from "@features/accounts/lib/server/account-admin";
import { listAllAccounts } from "@features/accounts/lib/server/account-admin-queries";
import {
  disableAccount,
  inviteAccount,
  reactivateAccount,
  resendInvitation,
  type ManagingActor,
} from "@features/accounts/lib/server/invitations";
import {
  getResetLinkState,
  PASSWORD_RESET_RULE,
  requestPasswordReset,
} from "@features/accounts/lib/server/password-reset";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-20T12:00:00.000Z");

const sysadmin: ManagingActor = { id: "", role: "sysadmin", standId: null };

const kofAdmin: ManagingActor = { id: "", role: "kof_admin", standId: null };

const standAdmin: ManagingActor = { id: "", role: "stand_admin", standId: "" };

let standId = "";

let otherStandId = "";

let testNumber = 0;

beforeAll(async () => {
  standId = await createStand(1);
  otherStandId = await createStand(2);
  sysadmin.id = await createAccount({ email: "root@ut.mx", role: "sysadmin" });
  kofAdmin.id = await createAccount({ email: "kof-root@ut.mx", role: "kof_admin" });
  standAdmin.standId = standId;
  standAdmin.id = await createAccount({ email: "stand-root@ut.mx", role: "stand_admin", standId });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Accounts with an audit entry cannot be deleted, so each test uses emails of its own and frees the shared places.
beforeEach(async () => {
  testNumber += 1;
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().account.updateMany({
    where: { role: { in: ["kof_staff", "stand_staff"] } },
    data: { status: "disabled" },
  });
});

describe("listAllAccounts", () => {
  it("lists every role with its stand, status and creation date", async () => {
    const roles = ["stand_admin", "stand_staff", "kof_admin", "kof_staff", "raffle_admin", "help_desk", "sysadmin"];

    const adminStand = await createStand(300 + testNumber);

    for (const role of roles) await createAccount({ email: mail(role), role, ...placeFor(role, adminStand) });

    const rows = await listAllAccounts({});
    const ours = rows.filter((row) => row.email.startsWith(`t${testNumber}`));

    expect(ours.map((row) => row.role).toSorted()).toEqual(roles.toSorted());
    expect(ours.find((row) => row.role === "stand_staff")).toMatchObject({ standId, status: "active", kofDesk: null });
    expect(ours.find((row) => row.role === "kof_staff")?.kofDesk).toBe(1);
    expect(ours[0].createdAt).toBeInstanceOf(Date);
  });

  it("filters by role, status and stand", async () => {
    await createAccount({ email: mail("a"), role: "help_desk" });
    await createAccount({ email: mail("b"), role: "help_desk", status: "disabled" });
    await createAccount({ email: mail("c"), role: "stand_staff", standId: otherStandId });

    const emails = async (filter: Parameters<typeof listAllAccounts>[0]) =>
      (await listAllAccounts(filter)).map((row) => row.email).filter((email) => email.startsWith(`t${testNumber}`));

    expect(await emails({ role: "help_desk", status: "disabled" })).toEqual([mail("b")]);
    expect((await emails({ role: "help_desk" })).toSorted()).toEqual([mail("a"), mail("b")]);
    expect(await emails({ standId: otherStandId })).toEqual([mail("c")]);
  });

  it("searches by name or email, ignoring the case", async () => {
    await createAccount({ email: mail("zeta"), role: "help_desk", name: "Marisol Quiroz" });

    expect((await listAllAccounts({ search: "MARISOL" })).map((row) => row.email)).toEqual([mail("zeta")]);
    expect((await listAllAccounts({ search: `t${testNumber}zeta` })).map((row) => row.name)).toEqual([
      "Marisol Quiroz",
    ]);
    expect(await listAllAccounts({ search: "no-existe-nadie" })).toEqual([]);
  });

  it("shows the last verified sign-in, or null when the account never signed in", async () => {
    const withLogin = await createAccount({ email: mail("in"), role: "help_desk" });

    await createAccount({ email: mail("never"), role: "help_desk" });
    await getPrisma().auditLog.create({
      data: {
        actorId: withLogin,
        action: "account.login_verified",
        entityType: "account",
        entityId: withLogin,
        detail: {},
      },
    });

    const rows = await listAllAccounts({ search: `t${testNumber}` });

    expect(rows.find((row) => row.id === withLogin)?.lastLoginAt).toBeInstanceOf(Date);
    expect(rows.find((row) => row.email === mail("never"))?.lastLoginAt).toBeNull();
  });
});

describe("the sysadmin managing every role", () => {
  it.each([
    { role: "sysadmin", desk: null, stand: false },
    { role: "stand_admin", desk: null, stand: true },
    { role: "stand_staff", desk: null, stand: true },
    { role: "kof_admin", desk: null, stand: false },
    { role: "kof_staff", desk: 2, stand: false },
    { role: "raffle_admin", desk: null, stand: false },
    { role: "help_desk", desk: null, stand: false },
  ] as const)("invites a $role with the stand or desk it needs", async ({ role, desk, stand }) => {
    const spareStand = stand ? await createStand(100 + testNumber) : null;
    const input = { name: "Ana", email: mail("ana"), role, kofDesk: desk, standId: spareStand };
    const result = await inviteAccount(sysadmin, input, NOW);

    expect(result.status).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).toMatchObject({
      role,
      status: "invited",
      kofDesk: desk,
      standId: spareStand,
      createdById: sysadmin.id,
    });
  });

  it("refuses a stand role without a stand, an unknown stand and a stand for another role", async () => {
    const base = { name: "Ana", email: mail("ana"), kofDesk: null };

    expect(await inviteAccount(sysadmin, { ...base, role: "stand_staff", standId: null }, NOW)).toEqual({
      status: "invalidStand",
    });
    expect(await inviteAccount(sysadmin, { ...base, role: "stand_staff", standId: "missing" }, NOW)).toEqual({
      status: "invalidStand",
    });
    expect(await inviteAccount(sysadmin, { ...base, role: "help_desk", standId }, NOW)).toEqual({
      status: "invalidStand",
    });
    expect(await getPrisma().account.findUnique({ where: { email: mail("ana") } })).toBeNull();
  });

  it("keeps one active administrator per stand, 3 staff per stand and one staff per KOF desk", async () => {
    const full = await createStand(200 + testNumber);

    expect((await inviteAccount(sysadmin, standInput("uno", "stand_admin", full), NOW)).status).toBe("invited");
    expect(await inviteAccount(sysadmin, standInput("dos", "stand_admin", full), NOW)).toEqual({
      status: "adminTaken",
    });

    for (let index = 0; index < MAX_STAND_STAFF; index += 1) {
      expect((await inviteAccount(sysadmin, standInput(`s${index}`, "stand_staff", full), NOW)).status).toBe("invited");
    }

    expect(await inviteAccount(sysadmin, standInput("s9", "stand_staff", full), NOW)).toEqual({ status: "standFull" });

    const desk = { name: "Luis", role: "kof_staff", kofDesk: 1 as const, standId: null };

    expect((await inviteAccount(sysadmin, { ...desk, email: mail("d1") }, NOW)).status).toBe("invited");
    expect(await inviteAccount(sysadmin, { ...desk, email: mail("d2") }, NOW)).toEqual({ status: "deskTaken" });
  });

  it("disables, reactivates and re-invites accounts of any role", async () => {
    const staff = await createAccount({ email: mail("st"), role: "stand_staff", standId });
    const invited = await createAccount({ email: mail("iv"), role: "raffle_admin", status: "invited" });

    expect((await resendInvitation(sysadmin, invited, NOW)).status).toBe("sent");
    expect(await disableAccount(sysadmin, staff)).toEqual({ status: "disabled" });
    expect((await reactivateAccount(sysadmin, staff, NOW)).status).toBe("reactivated");
  });

  it("refuses to reactivate a stand administrator while another one is invited", async () => {
    const stand = await createStand(400 + testNumber);
    const first = await createAccount({ email: mail("b1"), role: "stand_admin", standId: stand });

    await disableAccount(sysadmin, first);
    await createAccount({ email: mail("b2"), role: "stand_admin", status: "invited", standId: stand });

    expect(await reactivateAccount(sysadmin, first, NOW)).toEqual({ status: "adminTaken" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: first } })).status).toBe("disabled");
  });

  it("refuses to reactivate over the invariants", async () => {
    const first = await createAccount({ email: mail("a1"), role: "stand_admin", standId: otherStandId });

    await disableAccount(sysadmin, first);
    await createAccount({ email: mail("a2"), role: "stand_admin", standId: otherStandId });

    expect(await reactivateAccount(sysadmin, first, NOW)).toEqual({ status: "adminTaken" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: first } })).status).toBe("disabled");
  });
});

describe("protecting the sysadmin", () => {
  it("never lets a sysadmin disable themselves", async () => {
    await createAccount({ email: mail("other-root"), role: "sysadmin" });

    expect(await disableAccount(sysadmin, sysadmin.id)).toEqual({ status: "selfProtected" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: sysadmin.id } })).status).toBe("active");
  });

  it("never disables the last active sysadmin, even when the actor was disabled meanwhile", async () => {
    const lone = await createAccount({ email: mail("lone"), role: "sysadmin" });

    const others = await getPrisma().account.findMany({
      where: { role: "sysadmin", status: "active", id: { not: lone } },
      select: { id: true },
    });

    const otherIds = others.map((row) => row.id);

    await getPrisma().account.updateMany({ where: { id: { in: otherIds } }, data: { status: "disabled" } });

    expect(await disableAccount(sysadmin, lone)).toEqual({ status: "lastSysadmin" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: lone } })).status).toBe("active");

    await getPrisma().account.updateMany({ where: { id: { in: otherIds } }, data: { status: "active" } });
  });

  it("lets a sysadmin disable another one, closes its sessions and audits it", async () => {
    const other = await createAccount({ email: mail("other"), role: "sysadmin" });

    await getPrisma().session.create({
      data: { accountId: other, token: `s${testNumber}`, expiresAt: new Date("2030-01-01") },
    });

    expect(await disableAccount(sysadmin, other)).toEqual({ status: "disabled" });
    expect(await getPrisma().session.count({ where: { accountId: other } })).toBe(0);
    expect(await auditActions(other)).toEqual(["account.disable"]);
  });
});

describe("sendAdminPasswordReset", () => {
  it("queues the reset link for an active account, audits the sysadmin as actor and invalidates the previous link", async () => {
    const accountId = await createAccount({ email: mail("pw"), role: "stand_staff", standId });
    const first = await sendAdminPasswordReset(sysadmin, accountId, NOW);
    const second = await sendAdminPasswordReset(sysadmin, accountId, NOW);

    if (first.status !== "sent" || second.status !== "sent") throw new Error("the link was not sent");

    const sent = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: second.emailId } });
    const oldToken = await readToken(first.emailId);

    expect(sent.to).toBe(mail("pw"));
    expect(await getResetLinkState(oldToken, NOW)).toEqual({ status: "invalid" });
    expect(await getResetLinkState(await readToken(second.emailId), NOW)).toMatchObject({ status: "valid" });

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { entityId: accountId, action: "account.admin_password_reset_sent" },
    });

    expect(entry).toMatchObject({ actorId: sysadmin.id, detail: {} });
    expect(await getPrisma().passwordResetToken.count({ where: { accountId, usedAt: null } })).toBe(1);
  });

  it("sends nothing for an invited or disabled account, a missing account and an actor that is not the sysadmin", async () => {
    const invited = await createAccount({ email: mail("iv"), role: "help_desk", status: "invited" });
    const disabled = await createAccount({ email: mail("off"), role: "help_desk", status: "disabled" });
    const active = await createAccount({ email: mail("on"), role: "help_desk" });

    expect(await sendAdminPasswordReset(sysadmin, invited, NOW)).toEqual({ status: "wrongState" });
    expect(await sendAdminPasswordReset(sysadmin, disabled, NOW)).toEqual({ status: "wrongState" });
    expect(await sendAdminPasswordReset(sysadmin, "missing", NOW)).toEqual({ status: "notFound" });
    expect(await sendAdminPasswordReset(kofAdmin, active, NOW)).toEqual({ status: "forbidden" });
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("never spends the self-service limit of the owner, and the owner never spends the one of the sysadmin", async () => {
    const accountId = await createAccount({ email: mail("own"), role: "help_desk" });

    for (let attempt = 0; attempt < PASSWORD_RESET_RULE.limit; attempt += 1)
      await sendAdminPasswordReset(sysadmin, accountId, NOW);

    for (let attempt = 0; attempt < PASSWORD_RESET_RULE.limit; attempt += 1) {
      expect(await requestPasswordReset(mail("own"), NOW)).not.toBeNull();
    }

    expect(await requestPasswordReset(mail("own"), NOW)).toBeNull();
    expect(await sendAdminPasswordReset(sysadmin, accountId, NOW)).toEqual({ status: "rateLimited" });

    const another = await createAccount({ email: mail("own2"), role: "help_desk" });

    await requestPasswordReset(mail("own2"), NOW);

    expect((await sendAdminPasswordReset(sysadmin, another, NOW)).status).toBe("sent");
  });

  it("has its own hourly limit, so it neither spends nor is blocked by the self-service one", async () => {
    const accountId = await createAccount({ email: mail("rl"), role: "help_desk" });

    for (let attempt = 0; attempt < PASSWORD_RESET_RULE.limit; attempt += 1) {
      expect((await sendAdminPasswordReset(sysadmin, accountId, NOW)).status).toBe("sent");
    }

    expect(await sendAdminPasswordReset(sysadmin, accountId, NOW)).toEqual({ status: "rateLimited" });
    expect(await getPrisma().emailOutbox.count()).toBe(PASSWORD_RESET_RULE.limit);
    expect(await getPrisma().rateLimit.count({ where: { key: `password-reset:${mail("rl")}` } })).toBe(0);
  });
});

describe("closeAccountSessions and clearPendingLoginChallenges", () => {
  it("deletes every session of the account and only of that account, and audits it", async () => {
    const target = await createAccount({ email: mail("t"), role: "kof_admin" });
    const bystander = await createAccount({ email: mail("b"), role: "kof_admin" });

    for (const [accountId, token] of [
      [target, "a"],
      [target, "b"],
      [bystander, "c"],
    ] as const) {
      await getPrisma().session.create({
        data: { accountId, token: `${token}${testNumber}`, expiresAt: new Date("2030-01-01") },
      });
    }

    expect(await closeAccountSessions(sysadmin, target)).toEqual({ status: "closed", count: 2 });
    expect(await getPrisma().session.count({ where: { accountId: target } })).toBe(0);
    expect(await getPrisma().session.count({ where: { accountId: bystander } })).toBe(1);
    expect(
      await getPrisma().auditLog.findFirstOrThrow({ where: { entityId: target, action: "account.sessions_closed" } }),
    ).toMatchObject({
      actorId: sysadmin.id,
      detail: { count: 2 },
    });
  });

  it("deletes the pending 2FA challenges of the account only", async () => {
    const target = await createAccount({ email: mail("t"), role: "kof_admin" });
    const bystander = await createAccount({ email: mail("b"), role: "kof_admin" });

    for (const [accountId, token] of [
      [target, "a"],
      [bystander, "c"],
    ] as const) {
      await createChallenge(accountId, `${token}${testNumber}`);
    }

    expect(await clearPendingLoginChallenges(sysadmin, target)).toEqual({ status: "cleared", count: 1 });
    expect(await getPrisma().loginChallenge.count({ where: { accountId: target } })).toBe(0);
    expect(await getPrisma().loginChallenge.count({ where: { accountId: bystander } })).toBe(1);
    expect(
      await getPrisma().auditLog.findFirstOrThrow({
        where: { entityId: target, action: "account.two_factor_cleared" },
      }),
    ).toMatchObject({
      actorId: sysadmin.id,
      detail: { count: 1 },
    });
  });

  it("answers a missing account and an actor that is not the sysadmin without deleting anything", async () => {
    const target = await createAccount({ email: mail("t"), role: "kof_admin" });

    await createChallenge(target, `x${testNumber}`);
    await getPrisma().session.create({
      data: { accountId: target, token: `y${testNumber}`, expiresAt: new Date("2030-01-01") },
    });

    expect(await closeAccountSessions(sysadmin, "missing")).toEqual({ status: "notFound" });
    expect(await clearPendingLoginChallenges(sysadmin, "missing")).toEqual({ status: "notFound" });
    expect(await closeAccountSessions(standAdmin, target)).toEqual({ status: "forbidden" });
    expect(await clearPendingLoginChallenges(kofAdmin, target)).toEqual({ status: "forbidden" });
    expect(await getPrisma().session.count({ where: { accountId: target } })).toBe(1);
    expect(await getPrisma().loginChallenge.count({ where: { accountId: target } })).toBe(1);
  });
});

describe("the rules of the other managers are unchanged", () => {
  it("lets the KOF administrator invite only KOF staff and manage only them", async () => {
    const own = { name: "Luis", email: mail("kst"), role: "kof_staff", kofDesk: 2 as const };

    expect((await inviteAccount(kofAdmin, own, NOW)).status).toBe("invited");

    for (const role of ["sysadmin", "kof_admin", "help_desk", "stand_staff", "stand_admin"]) {
      expect(await inviteAccount(kofAdmin, { name: "X", email: mail(`k${role}`), role, kofDesk: null }, NOW)).toEqual({
        status: "forbidden",
      });
    }

    const rootId = await getPrisma().account.findUniqueOrThrow({ where: { email: "root@ut.mx" } });

    expect(await disableAccount(kofAdmin, rootId.id)).toEqual({ status: "forbidden" });
    expect(await disableAccount(kofAdmin, standAdmin.id)).toEqual({ status: "forbidden" });
  });

  it("lets the stand administrator manage only the staff of its own stand and ignores a stand named in the input", async () => {
    const created = await inviteAccount(
      standAdmin,
      { name: "Eva", email: mail("est"), role: "stand_staff", kofDesk: null, standId: otherStandId },
      NOW,
    );

    expect(created.status).toBe("invited");
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: mail("est") } })).standId).toBe(standId);

    const foreign = await createAccount({ email: mail("fst"), role: "stand_staff", standId: otherStandId });

    expect(await disableAccount(standAdmin, foreign)).toEqual({ status: "forbidden" });
    expect(await disableAccount(standAdmin, sysadmin.id)).toEqual({ status: "forbidden" });
    expect(
      await inviteAccount(
        standAdmin,
        { name: "X", email: mail("xx"), role: "stand_admin", kofDesk: null, standId },
        NOW,
      ),
    ).toEqual({
      status: "forbidden",
    });
    expect(await closeAccountSessions(standAdmin, foreign)).toEqual({ status: "forbidden" });
  });
});

function standInput(local: string, role: string, forStand: string) {
  return { name: "Ana", email: mail(local), role, kofDesk: null, standId: forStand };
}

interface Placement {
  standId?: string;
  kofDesk?: number;
}

function placeFor(role: string, adminStand: string): Placement {
  if (role === "kof_staff") return { kofDesk: 1 };

  if (role === "stand_admin") return { standId: adminStand };

  return role === "stand_staff" ? { standId } : {};
}

// Accounts that have an audit entry stay in the database, so each test uses emails of its own.
function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

async function createStand(number: number): Promise<string> {
  const stand = await getPrisma().stand.create({
    data: { zone: "A", number, studio: 1, groupCode: "101" },
    select: { id: true },
  });

  return stand.id;
}

async function createAccount(account: {
  email: string;
  role: string;
  name?: string;
  status?: string;
  standId?: string;
  kofDesk?: number;
}): Promise<string> {
  const status = account.status ?? "active";

  const created = await getPrisma().account.create({
    data: {
      email: account.email,
      name: account.name ?? "Cuenta",
      role: account.role,
      status,
      password: status === "invited" ? null : "hash",
      standId: account.standId,
      kofDesk: account.kofDesk,
      createdAt: NOW,
    },
    select: { id: true },
  });

  return created.id;
}

async function createChallenge(accountId: string, token: string) {
  await getPrisma().loginChallenge.create({
    data: { accountId, token: hashToken(token), codeHash: "code", expiresAt: new Date("2030-01-01") },
  });
}

async function auditActions(entityId: string): Promise<string[]> {
  const entries = await getPrisma().auditLog.findMany({ where: { entityId }, orderBy: { createdAt: "asc" } });

  return entries.map((entry) => entry.action);
}

// The email carries the token in its link; only its hash is stored, so the test reads it from the text.
async function readToken(emailId: string): Promise<string> {
  const { text } = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: emailId } });
  const token = /reset-password\/(\S+)/.exec(text)?.[1];

  if (!token) throw new Error("the email has no reset link");

  return token;
}
