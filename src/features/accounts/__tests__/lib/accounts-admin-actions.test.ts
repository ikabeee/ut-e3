/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import {
  clearTwoFactorAction,
  closeSessionsAction,
  sendPasswordResetAction,
  setSecondaryRoleAction,
} from "@features/accounts/lib/accounts-admin-actions";
import {
  disableAccountAction,
  inviteAccountAction,
  type ManagementActionState,
} from "@features/accounts/lib/management-actions";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession as createAccountSession } from "@shared/lib/server/session";
import { hashToken } from "@shared/lib/server/token-hash";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ERRORS = ACCOUNTS_COPY.management.errors;

const OUTCOMES = ACCOUNTS_COPY.management.outcomes;

const ACTIONS = { sendPasswordResetAction, closeSessionsAction, clearTwoFactorAction, setSecondaryRoleAction };

let afterStub = stubAfter();

let testNumber = 0;

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  refresh.mockClear();
  afterStub.restore();
  afterStub = stubAfter();
});

// The access tests run first: expectRefused needs an audit log that is still empty.
describe("access", () => {
  it.each(otherRoleCases(ACTIONS))(
    "%s calling %s is sent to the login and changes nothing",
    async (role, _name, action) => {
      await expectRefused(role, action);
      expect(refresh).not.toHaveBeenCalled();
    },
  );
});

describe("sendPasswordResetAction", () => {
  it("queues the reset email, schedules its delivery and refreshes", async () => {
    const accountId = await signInAsSysadminAndCreate("help_desk");

    expect(await sendPasswordResetAction(null, form(accountId))).toEqual({
      status: "done",
      message: OUTCOMES.resetSent,
    });
    expect(await getPrisma().emailOutbox.count({ where: { to: mail("help_desk") } })).toBe(1);
    expect(afterStub.callbacks).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("explains an invited account and a missing account; the reset can be sent past the old hourly limit", async () => {
    const invited = await signInAsSysadminAndCreate("help_desk", "invited");

    expect(await sendPasswordResetAction(null, form(invited))).toEqual(failure(ERRORS.wrongState));
    expect(await sendPasswordResetAction(null, form("missing"))).toEqual(failure(ERRORS.notFound));
    expect(await sendPasswordResetAction(null, form(""))).toEqual(failure(ERRORS.notFound));

    const active = await createAccount("raffle_admin");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await sendPasswordResetAction(null, form(active))).status).toBe("done");
    }
  });
});

describe("closeSessionsAction", () => {
  it("deletes the sessions of the account and says how many", async () => {
    const accountId = await signInAsSysadminAndCreate("kof_admin");

    await createSession(accountId, "one");
    await createSession(accountId, "two");

    expect(await closeSessionsAction(null, form(accountId))).toEqual({
      status: "done",
      message: OUTCOMES.sessionsClosed(2),
    });
    expect(await getPrisma().session.count({ where: { accountId } })).toBe(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("answers a missing account", async () => {
    await signInAs("sysadmin");

    expect(await closeSessionsAction(null, form("missing"))).toEqual(failure(ERRORS.notFound));
  });
});

describe("clearTwoFactorAction", () => {
  it("deletes the pending challenges of the account and says how many", async () => {
    const accountId = await signInAsSysadminAndCreate("kof_admin");

    await getPrisma().loginChallenge.create({
      data: { accountId, token: hashToken(`c${testNumber}`), codeHash: "x", expiresAt: new Date("2030-01-01") },
    });

    expect(await clearTwoFactorAction(null, form(accountId))).toEqual({
      status: "done",
      message: OUTCOMES.twoFactorCleared(1),
    });
    expect(await getPrisma().loginChallenge.count({ where: { accountId } })).toBe(0);
  });

  it("answers a missing account", async () => {
    await signInAs("sysadmin");

    expect(await clearTwoFactorAction(null, form("missing"))).toEqual(failure(ERRORS.notFound));
  });
});

describe("setSecondaryRoleAction (S1, S2)", () => {
  it("gives a stand administrator the secondary role, audits it under the sysadmin and refreshes", async () => {
    const sysadminId = await signInAs("sysadmin");
    const leaderId = await createStandAdmin();

    expect(await setSecondaryRoleAction(null, secondaryRoleForm(leaderId, "help_desk"))).toEqual({
      status: "done",
      message: OUTCOMES.secondaryRoleGranted("Atención"),
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leaderId } })).secondaryRole).toBe("help_desk");
    expect(
      await getPrisma().auditLog.findMany({ where: { entityId: leaderId, action: "account.secondary_role" } }),
    ).toEqual([expect.objectContaining({ actorId: sysadminId, detail: { from: null, to: "help_desk" } })]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("removes the secondary role with the option 'none'", async () => {
    await signInAs("sysadmin");

    const leaderId = await createStandAdmin("kof_admin");

    expect(await setSecondaryRoleAction(null, secondaryRoleForm(leaderId, "none"))).toEqual({
      status: "done",
      message: OUTCOMES.secondaryRoleRemoved,
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leaderId } })).secondaryRole).toBeNull();
  });

  it.each([
    ["a role that does not exist", "root"],
    ["the empty value", ""],
    ["another stand role", "stand_staff"],
  ])("explains %s and changes nothing", async (_case, value) => {
    await signInAs("sysadmin");

    const leaderId = await createStandAdmin();

    expect(await setSecondaryRoleAction(null, secondaryRoleForm(leaderId, value))).toEqual(
      failure(ERRORS.secondaryRoleInvalid),
    );
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leaderId } })).secondaryRole).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("explains an account that is not a stand administrator, a missing account and a repeated role", async () => {
    await signInAs("sysadmin");

    const helpDesk = await createAccount("help_desk");
    const leaderId = await createStandAdmin("raffle_admin");

    expect(await setSecondaryRoleAction(null, secondaryRoleForm(helpDesk, "kof_admin"))).toEqual(
      failure(ERRORS.notStandAdmin),
    );
    expect(await setSecondaryRoleAction(null, secondaryRoleForm("missing", "kof_admin"))).toEqual(
      failure(ERRORS.notFound),
    );
    expect(await setSecondaryRoleAction(null, secondaryRoleForm(leaderId, "raffle_admin"))).toEqual(
      failure(ERRORS.secondaryRoleUnchanged),
    );
  });

  it("explains that the last active sysadmin cannot lose its secondary role", async () => {
    const leaderId = await createStandAdmin("sysadmin");

    await getPrisma().account.updateMany({
      where: { role: "sysadmin", status: "active" },
      data: { status: "disabled" },
    });

    // The only sysadmin left is the leader itself, through its secondary role.
    stubCookies(createCookieJar());
    await createAccountSession(leaderId);

    expect(await setSecondaryRoleAction(null, secondaryRoleForm(leaderId, "none"))).toEqual(
      failure(ERRORS.lastSysadmin),
    );
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: leaderId } })).secondaryRole).toBe("sysadmin");
  });
});

describe("the actions that the page shares with the other panels", () => {
  it("explains that a sysadmin cannot disable themselves", async () => {
    const ownId = await signInAs("sysadmin");

    if (!ownId) throw new Error("the sysadmin has no account");

    expect(await disableAccountAction(null, form(ownId))).toEqual(failure(ERRORS.selfProtected));
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: ownId } })).status).toBe("active");
  });

  it("invites stand staff in the stand that the sysadmin chooses, and asks for the stand when it is missing", async () => {
    await signInAs("sysadmin");

    const stand = await getPrisma().stand.create({
      data: { zone: "B", number: 1, studio: 1, groupCode: "201" },
      select: { id: true },
    });

    const fields = { name: "Eva", email: mail("eva"), role: "stand_staff" };

    expect(await inviteAccountAction(null, inviteForm(fields))).toEqual(failure(ERRORS.standInvalid));
    expect(await inviteAccountAction(null, inviteForm({ ...fields, standId: stand.id }))).toEqual({
      status: "done",
      message: OUTCOMES.invited,
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: mail("eva") } })).standId).toBe(stand.id);
  });
});

function failure(message: string): ManagementActionState {
  return { status: "error", message };
}

function secondaryRoleForm(accountId: string, secondaryRole: string): FormData {
  const data = form(accountId);

  data.set("secondaryRole", secondaryRole);

  return data;
}

function form(accountId: string): FormData {
  const data = new FormData();

  data.set("accountId", accountId);

  return data;
}

async function createStandAdmin(secondaryRole?: string): Promise<string> {
  testNumber += 1;

  // One stand for every leader of these tests (the event has at most 18): the previous leader leaves it.
  const stand = await getPrisma().stand.upsert({
    where: { zone_number: { zone: "C", number: 1 } },
    update: {},
    create: { zone: "C", number: 1, studio: 1, groupCode: "301" },
    select: { id: true },
  });

  await getPrisma().account.updateMany({
    where: { standId: stand.id, role: "stand_admin" },
    data: { status: "disabled" },
  });

  const created = await getPrisma().account.create({
    data: {
      email: mail("leader"),
      name: "Líder",
      role: "stand_admin",
      secondaryRole,
      status: "active",
      password: "hash",
      standId: stand.id,
    },
    select: { id: true },
  });

  return created.id;
}

function inviteForm(fields: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.set(name, value));

  return data;
}

async function signInAsSysadminAndCreate(role: string, status = "active"): Promise<string> {
  testNumber += 1;
  stubCookies(createCookieJar());
  await signInAs("sysadmin");

  return createAccount(role, status);
}

async function createAccount(role: string, status = "active"): Promise<string> {
  const created = await getPrisma().account.create({
    data: {
      email: mail(role),
      name: "Cuenta",
      role,
      status,
      password: status === "invited" ? null : "hash",
    },
    select: { id: true },
  });

  return created.id;
}

async function createSession(accountId: string, token: string) {
  await getPrisma().session.create({
    data: { accountId, token: `${token}${testNumber}`, expiresAt: new Date("2030-01-01") },
  });
}

function mail(local: string): string {
  return `acc${testNumber}${local}@ut.mx`;
}
