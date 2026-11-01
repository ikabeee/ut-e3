/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import {
  disableAccountAction,
  inviteAccountAction,
  resendInvitationAction,
} from "@features/accounts/lib/management-actions";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ERRORS = ACCOUNTS_COPY.management.errors;

const OUTCOMES = ACCOUNTS_COPY.management.outcomes;

const accountIds: Record<string, string> = {};

let testNumber = 0;

let afterStub = stubAfter();

beforeAll(async () => {
  await createAccount("sysadmin", "sysadmin");
  await createAccount("kofAdmin", "kof_admin");
  await createAccount("kofStaff", "kof_staff");
  await createAccount("helpDesk", "help_desk");
});

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  testNumber += 1;
  refresh.mockClear();
  afterStub.restore();
  afterStub = stubAfter();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().account.updateMany({ where: { role: "kof_staff" }, data: { status: "disabled" } });
});

describe("inviteAccountAction", () => {
  it("invites an administrator for the sysadmin, schedules the email and refreshes the screen", async () => {
    await signInAs("sysadmin");

    const state = await inviteAccountAction(null, createForm({ name: "Ana", email: mail("ana"), role: "kof_admin" }));

    expect(state).toEqual({ status: "done", message: OUTCOMES.invited });
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).toMatchObject({
      role: "kof_admin",
      status: "invited",
    });
    expect(await getPrisma().emailOutbox.count()).toBe(1);
    expect(afterStub.callbacks).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("invites the staff of a desk for the KOF administrator", async () => {
    await signInAs("kofAdmin");

    const state = await inviteAccountAction(
      null,
      createForm({ name: "Luis", email: mail("luis"), role: "kof_staff", desk: "2" }),
    );

    expect(state.status).toBe("done");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("luis") } })).toMatchObject({
      role: "kof_staff",
      kofDesk: 2,
    });
  });

  it.each([
    { label: "an invalid form", fields: { name: "", email: "x", role: "kof_admin" }, message: ERRORS.nameRequired },
    {
      label: "a role the actor does not manage",
      fields: { name: "Ana", email: "ana-role@ut.mx", role: "kof_staff", desk: "1" },
      message: ERRORS.forbidden,
    },
    {
      label: "a staff member without a desk",
      fields: { name: "Ana", email: "ana-desk@ut.mx", role: "kof_admin", desk: "1" },
      message: ERRORS.deskInvalid,
    },
  ])("answers $label and sends nothing", async ({ fields, message }) => {
    await signInAs("sysadmin");

    expect(await inviteAccountAction(null, createForm(fields))).toEqual({ status: "error", message });
    expect(await getPrisma().emailOutbox.count()).toBe(0);
    expect(afterStub.callbacks).toHaveLength(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("explains a repeated email and an email that has a passport", async () => {
    await signInAs("sysadmin");
    await inviteAccountAction(null, createForm({ name: "Ana", email: mail("ana"), role: "kof_admin" }));
    await getPrisma().visitor.create({
      data: {
        fullName: "Neo",
        gamertag: `Neo${testNumber}`,
        email: mail("neo"),
        pin: "x",
        pinLookup: `y${testNumber}`,
      },
    });

    expect(await inviteAccountAction(null, createForm({ name: "Ana", email: mail("ana"), role: "help_desk" }))).toEqual(
      { status: "error", message: ERRORS.emailTaken },
    );
    expect(await inviteAccountAction(null, createForm({ name: "Neo", email: mail("neo"), role: "help_desk" }))).toEqual(
      {
        status: "error",
        message: ERRORS.hasPassport,
      },
    );
  });

  it("explains that a desk is taken", async () => {
    await signInAs("kofAdmin");
    await inviteAccountAction(null, createForm({ name: "A", email: mail("a"), role: "kof_staff", desk: "1" }));

    expect(
      await inviteAccountAction(null, createForm({ name: "B", email: mail("b"), role: "kof_staff", desk: "1" })),
    ).toEqual({ status: "error", message: ERRORS.deskTaken });
  });

  it.each(["kofStaff", "helpDesk"])("sends a %s to /login without inviting anyone", async (key) => {
    await signInAs(key);

    await expect(
      inviteAccountAction(null, createForm({ name: "Ana", email: mail("ana"), role: "kof_admin" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
    expect(await getPrisma().account.findUnique({ where: { email: mail("ana") } })).toBeNull();
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(
      inviteAccountAction(null, createForm({ name: "Ana", email: mail("ana"), role: "kof_admin" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

describe("resendInvitationAction", () => {
  it("sends a new link, schedules the email and refreshes", async () => {
    const accountId = await inviteAs("sysadmin", { name: "Ana", email: mail("ana"), role: "kof_admin" });

    afterStub.callbacks.length = 0;
    refresh.mockClear();

    const state = await resendInvitationAction(null, createForm({ accountId }));

    expect(state).toEqual({ status: "done", message: OUTCOMES.resent });
    expect(await getPrisma().emailOutbox.count()).toBe(2);
    expect(afterStub.callbacks).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("answers an account that does not exist and a form without an account", async () => {
    await signInAs("sysadmin");

    const notFound = { status: "error", message: ERRORS.notFound };

    expect(await resendInvitationAction(null, createForm({ accountId: "missing" }))).toEqual(notFound);
    expect(await resendInvitationAction(null, createForm({}))).toEqual(notFound);
  });

  it("refuses the account of another role and one that was already activated", async () => {
    const adminId = await inviteAs("sysadmin", { name: "Ana", email: mail("ana"), role: "kof_admin" });

    await signInAs("kofAdmin");

    expect(await resendInvitationAction(null, createForm({ accountId: adminId }))).toEqual({
      status: "error",
      message: ERRORS.forbidden,
    });

    await getPrisma().account.update({ where: { id: adminId }, data: { status: "active", password: "hash" } });
    await signInAs("sysadmin");

    expect(await resendInvitationAction(null, createForm({ accountId: adminId }))).toEqual({
      status: "error",
      message: ERRORS.wrongState,
    });
  });
});

describe("disableAccountAction", () => {
  it("disables the account and refreshes", async () => {
    const accountId = await inviteAs("kofAdmin", { name: "Luis", email: mail("luis"), role: "kof_staff", desk: "1" });

    refresh.mockClear();

    const state = await disableAccountAction(null, createForm({ accountId }));

    expect(state).toEqual({ status: "done", message: OUTCOMES.disabled });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } })).status).toBe("disabled");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refuses an account the actor does not manage and one that is already disabled", async () => {
    const adminId = await inviteAs("sysadmin", { name: "Ana", email: mail("ana"), role: "kof_admin" });

    await signInAs("kofAdmin");

    expect(await disableAccountAction(null, createForm({ accountId: adminId }))).toEqual({
      status: "error",
      message: ERRORS.forbidden,
    });

    await signInAs("sysadmin");
    await disableAccountAction(null, createForm({ accountId: adminId }));

    expect(await disableAccountAction(null, createForm({ accountId: adminId }))).toEqual({
      status: "error",
      message: ERRORS.wrongState,
    });
  });

  it("sends an account that manages nobody to /login", async () => {
    await signInAs("kofStaff");

    await expect(disableAccountAction(null, createForm({ accountId: accountIds.helpDesk }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: accountIds.helpDesk } })).status).toBe("active");
  });
});

// Accounts that have an audit entry stay in the database, so each test uses emails of its own.
function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

async function createAccount(key: string, role: string) {
  const account = await getPrisma().account.create({
    data: { email: `${key.toLowerCase()}@ut.mx`, name: key, role, status: "active", password: "scrypt$1$1$1$a$b" },
  });

  accountIds[key] = account.id;
}

async function inviteAs(key: string, fields: Record<string, string> & { email: string }): Promise<string> {
  await signInAs(key);
  await inviteAccountAction(null, createForm(fields));

  return (await getPrisma().account.findUniqueOrThrow({ where: { email: fields.email } })).id;
}

async function signInAs(key: string) {
  stubCookies(createCookieJar());
  await createSession(accountIds[key]);
}

function createForm(fields: Record<string, string | undefined>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => {
    if (value !== undefined) form.append(name, value);
  });

  return form;
}
