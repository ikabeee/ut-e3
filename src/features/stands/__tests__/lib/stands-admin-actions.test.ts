/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import {
  createStandAction,
  inviteStandAdminAction,
  updateStandAction,
} from "@features/stands/lib/stands-admin-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const COPY = STANDS_COPY.admin;

const ids = { sysadmin: "", standAdmin: "", stand: "" };

let testNumber = 0;

let afterStub = stubAfter();

beforeAll(async () => {
  ids.stand = (await getPrisma().stand.create({ data: { zone: "D", number: 1, studio: 1, groupCode: "101" } })).id;
  ids.sysadmin = (await createAccount({ email: "sysadmin@ut.mx", role: "sysadmin" })).id;
  ids.standAdmin = (await createAccount({ email: "admin@ut.mx", role: "stand_admin", standId: ids.stand })).id;
});

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  testNumber += 1;
  refresh.mockClear();
  updateTag.mockClear();
  afterStub.restore();
  afterStub = stubAfter();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
});

describe("createStandAction (RF-39)", () => {
  it("creates the stand and its administrator, schedules the email and refreshes", async () => {
    await signInAs(ids.sysadmin);

    const state = await createStandAction(null, form({ zone: "T", number: "2" }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.created });
    expect(
      await getPrisma().stand.findUniqueOrThrow({ where: { zone_number: { zone: "T", number: 2 } } }),
    ).toMatchObject({
      studio: 6,
      groupCode: "101",
    });
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).toMatchObject({
      role: "stand_admin",
      status: "invited",
    });
    expect(afterStub.callbacks).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("answers the first problem of the form and writes nothing", async () => {
    await signInAs(ids.sysadmin);

    expect(await createStandAction(null, form({ zone: "Z" }))).toEqual({
      status: "error",
      message: COPY.errors.zoneInvalid,
    });
    expect(await createStandAction(null, form({ number: "9" }))).toEqual({
      status: "error",
      message: COPY.errors.numberInvalid(3),
    });
    expect(await getPrisma().account.findUnique({ where: { email: mail("ana") } })).toBeNull();
    expect(afterStub.callbacks).toHaveLength(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("says when the stand or the email are taken", async () => {
    await signInAs(ids.sysadmin);

    expect(await createStandAction(null, form({ zone: "D", number: "1" }))).toEqual({
      status: "error",
      message: COPY.errors.standTaken,
    });
    expect(await createStandAction(null, form({ adminEmail: "admin@ut.mx", zone: "D", number: "2" }))).toEqual({
      status: "error",
      message: COPY.errors.emailTaken,
    });
  });

  it.each(["standAdmin"] as const)("is not available to the %s", async (key) => {
    await signInAs(ids[key]);

    await expect(createStandAction(null, form({ zone: "T", number: "3" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPrisma().stand.findUnique({ where: { zone_number: { zone: "T", number: 3 } } })).toBeNull();
  });

  it("is not available without a session", async () => {
    await expect(createStandAction(null, form({ zone: "T", number: "3" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

describe("updateStandAction", () => {
  it("changes the stand and refreshes the catalog, whose cards show its code", async () => {
    await signInAs(ids.sysadmin);

    const state = await updateStandAction(null, form({ standId: ids.stand, zone: "D", number: "1", studio: "7" }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.updated });
    expect((await getPrisma().stand.findUniqueOrThrow({ where: { id: ids.stand } })).studio).toBe(7);
    expect(updateTag).toHaveBeenCalledWith("games");
  });

  it("says when the stand does not exist or the new place is taken", async () => {
    await signInAs(ids.sysadmin);

    expect(await updateStandAction(null, form({ standId: "missing" }))).toEqual({
      status: "error",
      message: COPY.errors.notFound,
    });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("is not available to a stand administrator", async () => {
    await signInAs(ids.standAdmin);

    await expect(updateStandAction(null, form({ standId: ids.stand, studio: "9" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect((await getPrisma().stand.findUniqueOrThrow({ where: { id: ids.stand } })).studio).not.toBe(9);
  });
});

describe("inviteStandAdminAction", () => {
  it("refuses a second administrator while the first is active", async () => {
    await signInAs(ids.sysadmin);

    expect(await inviteStandAdminAction(null, form({ standId: ids.stand }))).toEqual({
      status: "error",
      message: COPY.errors.adminExists,
    });
  });

  it("invites the new administrator when the stand has none", async () => {
    await signInAs(ids.sysadmin);

    const empty = await getPrisma().stand.create({ data: { zone: "D", number: 3, studio: 1, groupCode: "101" } });
    const state = await inviteStandAdminAction(null, form({ standId: empty.id }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.adminInvited });
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).toMatchObject({
      role: "stand_admin",
      standId: empty.id,
    });
    expect(afterStub.callbacks).toHaveLength(1);
  });

  it("is not available to a stand administrator", async () => {
    await signInAs(ids.standAdmin);

    await expect(inviteStandAdminAction(null, form({ standId: ids.stand }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

async function signInAs(accountId: string) {
  stubCookies(createCookieJar());
  await createSession(accountId);
}

function form(overrides: Record<string, string>): FormData {
  const fields = {
    zone: "A",
    number: "1",
    studio: "6",
    groupCode: "101",
    adminName: "Ana Pérez",
    adminEmail: mail("ana"),
    ...overrides,
  };

  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

async function createAccount(account: { email: string; role: string; standId?: string }) {
  return getPrisma().account.create({
    data: { ...account, name: account.email, status: "active", password: "hash" },
  });
}
