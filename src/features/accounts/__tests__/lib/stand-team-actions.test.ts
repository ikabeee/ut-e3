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

const ids = { admin: "", otherAdmin: "", staff: "", otherStaff: "", standStaff: "", stand: "", otherStand: "" };

let testNumber = 0;

let afterStub = stubAfter();

beforeAll(async () => {
  ids.stand = (await createStand(1)).id;
  ids.otherStand = (await createStand(2)).id;
  ids.admin = (await createAccount({ email: "admin@ut.mx", role: "stand_admin", standId: ids.stand })).id;
  ids.otherAdmin = (await createAccount({ email: "other@ut.mx", role: "stand_admin", standId: ids.otherStand })).id;
  ids.standStaff = (await createAccount({ email: "staff@ut.mx", role: "stand_staff", standId: ids.stand })).id;
  ids.otherStaff = (await createAccount({ email: "ostaff@ut.mx", role: "stand_staff", standId: ids.otherStand })).id;
});

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

// The staff accounts of the other tests stay disabled, so each test has the 3 places of its stand free.
beforeEach(async () => {
  testNumber += 1;
  refresh.mockClear();
  afterStub.restore();
  afterStub = stubAfter();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().account.updateMany({
    where: { role: "stand_staff", id: { notIn: [ids.standStaff, ids.otherStaff] } },
    data: { status: "disabled" },
  });
  await getPrisma().account.updateMany({
    where: { id: { in: [ids.standStaff, ids.otherStaff] } },
    data: { status: "active" },
  });
});

describe("the accounts actions for a stand administrator (RF-32)", () => {
  it("invites staff into the stand of the session, sends the email and refreshes", async () => {
    await signInAs(ids.admin);

    const state = await inviteAccountAction(null, form({ name: "Luis", email: mail("luis"), role: "stand_staff" }));

    expect(state).toEqual({ status: "done", message: ACCOUNTS_COPY.management.outcomes.invited });
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("luis") } })).toMatchObject({
      role: "stand_staff",
      standId: ids.stand,
    });
    expect(afterStub.callbacks).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("ignores a stand that the form names", async () => {
    await signInAs(ids.admin);

    await inviteAccountAction(
      null,
      form({ name: "Luis", email: mail("luis"), role: "stand_staff", standId: ids.otherStand }),
    );

    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("luis") } })).toMatchObject({
      standId: ids.stand,
    });
  });

  it("refuses the 4th staff account with the message of the limit", async () => {
    await signInAs(ids.admin);
    await getPrisma().account.update({ where: { id: ids.standStaff }, data: { status: "disabled" } });

    for (const name of ["uno", "dos", "tres"]) {
      await inviteAccountAction(null, form({ name, email: mail(name), role: "stand_staff" }));
    }

    const state = await inviteAccountAction(null, form({ name: "Cuatro", email: mail("cuatro"), role: "stand_staff" }));

    expect(state).toEqual({ status: "error", message: ERRORS.standFull });
    expect(await getPrisma().account.findUnique({ where: { email: mail("cuatro") } })).toBeNull();
  });

  it("refuses a role that is not the staff of the stand", async () => {
    await signInAs(ids.admin);

    const state = await inviteAccountAction(null, form({ name: "Ana", email: mail("ana"), role: "stand_admin" }));

    expect(state).toEqual({ status: "error", message: ERRORS.forbidden });
    expect(await getPrisma().account.findUnique({ where: { email: mail("ana") } })).toBeNull();
  });

  it("disables its own staff, whose session stops working at once", async () => {
    await signInAs(ids.admin);
    await signInAs(ids.standStaff);
    await signInAs(ids.admin);

    expect(await disableAccountAction(null, form({ accountId: ids.standStaff }))).toMatchObject({ status: "done" });
    expect(await getPrisma().session.count({ where: { accountId: ids.standStaff } })).toBe(0);
  });

  it("cannot resend or disable the staff of another stand", async () => {
    await signInAs(ids.admin);

    const forbidden = { status: "error", message: ERRORS.forbidden };

    expect(await disableAccountAction(null, form({ accountId: ids.otherStaff }))).toEqual(forbidden);
    expect(await resendInvitationAction(null, form({ accountId: ids.otherStaff }))).toEqual(forbidden);
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: ids.otherStaff } })).status).toBe("active");
  });

  it("is not available to the staff of the stand", async () => {
    await signInAs(ids.standStaff);

    await expect(
      inviteAccountAction(null, form({ name: "Ana", email: mail("ana"), role: "stand_staff" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

async function signInAs(accountId: string) {
  stubCookies(createCookieJar());
  await createSession(accountId);
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}

async function createStand(number: number) {
  return getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });
}

async function createAccount(account: { email: string; role: string; standId: string }) {
  return getPrisma().account.create({
    data: { ...account, name: account.email, status: "active", password: "hash" },
  });
}
