/**
 * @jest-environment node
 */
import { getKofAccount, requireKofAccount, requireSysadmin } from "@features/accounts/lib/server/current-account";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

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

function createAccount(role: string, kofDesk?: number) {
  return getPrisma().account.create({
    data: { email: "cuenta@ut.mx", name: "Cuenta", role, status: "active", password: "scrypt$1$1$1$a$b", kofDesk },
  });
}
