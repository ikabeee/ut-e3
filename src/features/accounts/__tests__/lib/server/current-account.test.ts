/**
 * @jest-environment node
 */
import {
  getKofAccount,
  getKofViewer,
  getRaffleAdmin,
  getSysadmin,
  requireAccountManager,
  requireStandAdmin,
  requireKofAccount,
  requireKofViewer,
  requireRaffleAdmin,
  requireRecoveryAgent,
  requireSysadmin,
} from "@features/accounts/lib/server/current-account";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { liftSysadminGuard } from "@shared/__tests__/lib/server/sysadmin-guard";

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
  await liftSysadminGuard(getPrisma());
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
      roles: ["sysadmin"],
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

describe("requireRaffleAdmin", () => {
  it("returns the signed-in raffle administrator", async () => {
    const account = await createAccount("raffle_admin");

    await createSession(account.id);

    expect(await requireRaffleAdmin()).toMatchObject({ id: account.id, role: "raffle_admin" });
  });

  it("returns the sysadmin, who operates the raffle as a raffle administrator", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);

    expect(await requireRaffleAdmin()).toMatchObject({ id: account.id, role: "sysadmin" });
    expect(await getRaffleAdmin()).toMatchObject({ id: account.id });
  });

  it.each(["help_desk", "kof_admin", "kof_staff", "stand_staff"])("sends a %s to /login", async (role) => {
    await createSession((await createAccount(role)).id);

    await expect(requireRaffleAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireRaffleAdmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
    expect(await getRaffleAdmin()).toBeNull();
  });

  it("answers null in a Route Handler for any other role", async () => {
    await createSession((await createAccount("kof_admin")).id);

    expect(await getRaffleAdmin()).toBeNull();
  });
});

describe("getKofAccount", () => {
  it("answers null instead of redirecting when there is no KOF session", async () => {
    expect(await getKofAccount()).toBeNull();

    await createSession((await createAccount("help_desk")).id);

    expect(await getKofAccount()).toBeNull();
  });

  it("returns the sysadmin as a KOF administrator, with no desk", async () => {
    const sysadmin = await createAccount("sysadmin");

    await createSession(sysadmin.id);

    expect(await getKofAccount()).toMatchObject({ id: sysadmin.id, role: "kof_admin", kofDesk: null });
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
      roles: ["kof_admin"],
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

  it.each(["help_desk", "raffle_admin", "stand_staff"])("sends a %s to /login", async (role) => {
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

    expect(await requireRecoveryAgent()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role,
      roles: [role],
    });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it.each([
    ["stand_admin", "/stand/kiosk"],
    ["stand_staff", "/stand/kiosk"],
    ["kof_admin", "/admin/kof"],
    ["kof_staff", "/admin/kof"],
    ["raffle_admin", "/admin/raffle"],
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
      roles: ["stand_admin"],
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

function createAccount(role: string, kofDesk?: number, secondaryRole?: string) {
  return getPrisma().account.create({
    data: {
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role,
      secondaryRole,
      status: "active",
      password: "scrypt$1$1$1$a$b",
      kofDesk,
      standId: role.startsWith("stand_") ? standId : undefined,
    },
  });
}

describe("requireKofViewer (S37)", () => {
  it("lets a sysadmin in to see the KOF section, with no desk", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);

    expect(await requireKofViewer()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "sysadmin",
      roles: ["sysadmin"],
      kofDesk: null,
    });
  });

  it("returns a KOF administrator, as requireKofAccount does", async () => {
    const admin = await createAccount("kof_admin");

    await createSession(admin.id);

    expect(await requireKofViewer()).toMatchObject({ id: admin.id, role: "kof_admin", kofDesk: null });
  });

  it("returns a KOF staff member with its desk, as requireKofAccount does", async () => {
    const staff = await createAccount("kof_staff", 2);

    await createSession(staff.id);

    expect(await requireKofViewer()).toMatchObject({ id: staff.id, role: "kof_staff", kofDesk: 2 });
  });

  it.each(["help_desk", "raffle_admin", "stand_admin", "stand_staff"])("sends a %s to /login", async (role) => {
    await createSession((await createAccount(role)).id);

    await expect(requireKofViewer()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireKofViewer()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a disabled sysadmin to /login", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);
    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    await expect(requireKofViewer()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("answers null in a Route Handler for a visitor, and the account for a sysadmin", async () => {
    expect(await getKofViewer()).toBeNull();

    await createSession((await createAccount("sysadmin")).id);

    expect(await getKofViewer()).toMatchObject({ role: "sysadmin", kofDesk: null });
  });

  it("gives the sysadmin requireKofAccount as a KOF administrator, attributed to its own account", async () => {
    const sysadmin = await createAccount("sysadmin");

    await createSession(sysadmin.id);

    expect(await requireKofAccount()).toEqual({
      id: sysadmin.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "kof_admin",
      roles: ["sysadmin"],
      kofDesk: null,
    });
  });
});

// S1, S2: a stand administrator with a secondary role works in the area of that role as an account of that role, and
// keeps its stand everywhere else.
describe("an account with a secondary role", () => {
  const OTHER_SECONDARY = ["help_desk", "kof_admin", "raffle_admin", "sysadmin"];

  async function signInDual(secondaryRole: string) {
    const account = await createAccount("stand_admin", undefined, secondaryRole);

    await createSession(account.id);

    return account;
  }

  function expectLogin(attempt: Promise<unknown>) {
    return expect(attempt).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  }

  it("is a sysadmin in the sysadmin area only with the secondary role sysadmin", async () => {
    const account = await signInDual("sysadmin");

    expect(await requireSysadmin()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "sysadmin",
      roles: ["stand_admin", "sysadmin"],
    });
    expect(await getSysadmin()).toMatchObject({ id: account.id, role: "sysadmin" });
  });

  it.each(["help_desk", "kof_admin", "raffle_admin"])(
    "is not a sysadmin with the secondary role %s, and a stand administrator alone is not either",
    async (secondaryRole) => {
      await signInDual(secondaryRole);

      await expectLogin(requireSysadmin());
      expect(await getSysadmin()).toBeNull();
    },
  );

  it("is a stand administrator alone nowhere but at its stand", async () => {
    await createSession((await createAccount("stand_admin")).id);

    await expectLogin(requireSysadmin());
    await expectLogin(requireRaffleAdmin());
    await expectLogin(requireKofAccount());
    await expectLogin(requireKofViewer());
    await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(";/stand/kiosk;") });
    expect(await requireStandAdmin()).toMatchObject({ role: "stand_admin", standId });
  });

  it.each([
    ["raffle_admin", "raffle_admin"],
    ["sysadmin", "sysadmin"],
  ])("operates the raffle with the secondary role %s as that role", async (secondaryRole, role) => {
    const account = await signInDual(secondaryRole);

    expect(await requireRaffleAdmin()).toMatchObject({ id: account.id, role });
    expect(await getRaffleAdmin()).toMatchObject({ id: account.id, role });
  });

  it.each(["help_desk", "kof_admin"])(
    "does not operate the raffle with the secondary role %s",
    async (secondaryRole) => {
      await signInDual(secondaryRole);

      await expectLogin(requireRaffleAdmin());
      expect(await getRaffleAdmin()).toBeNull();
    },
  );

  it.each(["kof_admin", "sysadmin"])(
    "captures for the KOF as an administrator, with no desk, via %s",
    async (secondaryRole) => {
      const account = await signInDual(secondaryRole);

      expect(await requireKofAccount()).toMatchObject({ id: account.id, role: "kof_admin", kofDesk: null });
      expect(await getKofAccount()).toMatchObject({ id: account.id, role: "kof_admin", kofDesk: null });
    },
  );

  it("shows the KOF section as a KOF administrator with kof_admin and as a sysadmin with sysadmin", async () => {
    const kof = await signInDual("kof_admin");

    expect(await requireKofViewer()).toMatchObject({ id: kof.id, role: "kof_admin", kofDesk: null });

    await getPrisma().session.deleteMany();

    const sysadmin = await getPrisma().account.update({ where: { id: kof.id }, data: { secondaryRole: "sysadmin" } });

    await createSession(sysadmin.id);

    expect(await getKofViewer()).toMatchObject({ id: kof.id, role: "sysadmin", kofDesk: null });
  });

  it.each(["help_desk", "raffle_admin"])("does not open the KOF with the secondary role %s", async (secondaryRole) => {
    await signInDual(secondaryRole);

    await expectLogin(requireKofAccount());
    await expectLogin(requireKofViewer());
    expect(await getKofAccount()).toBeNull();
    expect(await getKofViewer()).toBeNull();
  });

  it.each(["help_desk", "sysadmin"])("works at the recovery desk with the secondary role %s", async (secondaryRole) => {
    const account = await signInDual(secondaryRole);

    expect(await requireRecoveryAgent()).toMatchObject({ id: account.id, role: secondaryRole });
  });

  it.each(["kof_admin", "raffle_admin"])(
    "is sent from the recovery desk to its primary home with the secondary role %s",
    async (secondaryRole) => {
      await signInDual(secondaryRole);

      await expect(requireRecoveryAgent()).rejects.toMatchObject({ digest: expect.stringContaining(";/stand/kiosk;") });
    },
  );

  it.each(OTHER_SECONDARY)(
    "keeps the primary role and the stand in the stand guards with %s",
    async (secondaryRole) => {
      const account = await signInDual(secondaryRole);

      expect(await requireStandAdmin()).toMatchObject({ id: account.id, role: "stand_admin", standId });
      expect(await requireAccountManager()).toMatchObject({ id: account.id, role: "stand_admin", standId });
    },
  );

  it("lets the account manager carry the secondary role, so a secondary KOF administrator can invite KOF staff", async () => {
    await signInDual("kof_admin");

    expect(await requireAccountManager()).toMatchObject({ role: "stand_admin", secondaryRole: "kof_admin", standId });
  });

  it("gives a stand administrator without a secondary role no secondary role as a manager", async () => {
    await createSession((await createAccount("stand_admin")).id);

    expect(await requireAccountManager()).toMatchObject({ role: "stand_admin", secondaryRole: null });
  });

  it("answers null or the login to a disabled account with a secondary role", async () => {
    const account = await signInDual("sysadmin");

    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    await expectLogin(requireSysadmin());
    await expectLogin(requireRaffleAdmin());
    await expectLogin(requireKofAccount());
    expect(await getSysadmin()).toBeNull();
  });
});
