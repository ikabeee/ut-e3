/**
 * @jest-environment node
 */
import {
  getKofAccount,
  requireAccountManager,
  requireStandAdmin,
  requireKofAccount,
  requireRecoveryAgent,
  requireSysadmin,
} from "@features/accounts/lib/server/current-account";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let standId = "";

beforeAll(async () => {
  standId = (await getPrisma().stand.create({ data: { zone: "A", number: 1, studio: 1, groupCode: "101" } })).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().account.deleteMany();
});

describe("requireSysadmin", () => {
  it("returns the signed-in sysadmin", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);

    expect(await requireSysadmin()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "sysadmin",
    });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireSysadmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a signed-in account with another role to /login", async () => {
    const account = await createAccount("help_desk");

    await createSession(account.id);

    await expect(requireSysadmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

describe("getKofAccount", () => {
  it("answers null instead of redirecting when there is no KOF session", async () => {
    expect(await getKofAccount()).toBeNull();

    const sysadmin = await createAccount("sysadmin");

    await createSession(sysadmin.id);

    expect(await getKofAccount()).toBeNull();
  });

  it("returns the KOF staff member with its desk", async () => {
    const account = await createAccount("kof_staff", 2);

    await createSession(account.id);

    expect(await getKofAccount()).toMatchObject({ id: account.id, role: "kof_staff", kofDesk: 2 });
  });
});

describe("requireKofAccount", () => {
  it("returns a KOF administrator, who has no desk", async () => {
    const account = await createAccount("kof_admin");

    await createSession(account.id);

    expect(await requireKofAccount()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "kof_admin",
      kofDesk: null,
    });
  });

  it.each([1, 2] as const)("returns a KOF staff member with the desk %i", async (desk) => {
    const account = await createAccount("kof_staff", desk);

    await createSession(account.id);

    expect(await requireKofAccount()).toMatchObject({ id: account.id, role: "kof_staff", kofDesk: desk });
  });

  it("returns a KOF staff member that has no desk yet with kofDesk null", async () => {
    const account = await createAccount("kof_staff");

    await createSession(account.id);

    expect(await requireKofAccount()).toMatchObject({ role: "kof_staff", kofDesk: null });
  });

  it.each(["sysadmin", "help_desk", "raffle_admin"])("sends a %s to /login", async (role) => {
    const account = await createAccount(role);

    await createSession(account.id);

    await expect(requireKofAccount()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireKofAccount()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a disabled KOF account to /login", async () => {
    const account = await createAccount("kof_admin");

    await createSession(account.id);
    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    await expect(requireKofAccount()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

describe("requireRecoveryAgent", () => {
  it.each(["help_desk", "sysadmin"])("returns a signed-in %s", async (role) => {
    const account = await createAccount(role);

    await createSession(account.id);

    expect(await requireRecoveryAgent()).toEqual({ id: account.id, email: "cuenta@ut.mx", name: "Cuenta", role });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it.each([
    ["stand_admin", "/stand/kiosk"],
    ["stand_staff", "/stand/kiosk"],
    ["kof_admin", "/admin/kof"],
    ["kof_staff", "/admin/kof"],
    ["raffle_admin", "/admin"],
  ])("sends a %s to its own home, %s", async (role, home) => {
    const account = await createAccount(role);

    await createSession(account.id);

    await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(`;${home};`) });
  });

  it("sends a disabled help desk account to /login", async () => {
    const account = await createAccount("help_desk");

    await createSession(account.id);
    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

describe("requireStandAdmin (RF-31, RF-32)", () => {
  it("returns the signed-in stand administrator with its stand", async () => {
    const account = await createAccount("stand_admin");

    await createSession(account.id);

    expect(await requireStandAdmin()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "stand_admin",
      standId,
    });
  });

  it("sends the staff of the stand back to its kiosk", async () => {
    const account = await createAccount("stand_staff");

    await createSession(account.id);

    await expect(requireStandAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/stand/kiosk;") });
  });

  it.each(["sysadmin", "help_desk", "kof_admin"])("sends a %s to /login", async (role) => {
    const account = await createAccount(role);

    await createSession(account.id);

    await expect(requireStandAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a visitor without a session and a disabled administrator to /login", async () => {
    await expect(requireStandAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });

    const account = await createAccount("stand_admin");

    await createSession(account.id);
    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    await expect(requireStandAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

describe("requireAccountManager", () => {
  it("carries the stand of a stand administrator, so the functions that manage accounts can scope to it", async () => {
    const account = await createAccount("stand_admin");

    await createSession(account.id);

    expect(await requireAccountManager()).toMatchObject({ id: account.id, role: "stand_admin", standId });
  });

  it("has no stand for the sysadmin", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);

    expect(await requireAccountManager()).toMatchObject({ id: account.id, standId: null });
  });

  it("is not available to the staff of a stand", async () => {
    const account = await createAccount("stand_staff");

    await createSession(account.id);

    await expect(requireAccountManager()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

function createAccount(role: string, kofDesk?: number) {
  return getPrisma().account.create({
    data: {
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role,
      status: "active",
      password: "scrypt$1$1$1$a$b",
      kofDesk,
      standId: role.startsWith("stand_") ? standId : undefined,
    },
  });
}
