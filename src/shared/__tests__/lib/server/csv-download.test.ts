/**
 * @jest-environment node
 */
import { csvDownload, refuseUnlessSysadmin } from "@shared/lib/server/csv-download";
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

describe("refuseUnlessSysadmin", () => {
  it("lets a sysadmin through", async () => {
    await signIn({ role: "sysadmin" });

    expect(await refuseUnlessSysadmin()).toBeNull();
  });

  it("lets through a stand administrator whose secondary role is sysadmin", async () => {
    await signIn({ role: "stand_admin", secondaryRole: "sysadmin" });

    expect(await refuseUnlessSysadmin()).toBeNull();
  });

  it("answers 401 without a session", async () => {
    await expectUnauthorized(await refuseUnlessSysadmin());
  });

  it.each([
    ["a stand administrator alone", { role: "stand_admin" }],
    ["a stand administrator with the secondary role help_desk", { role: "stand_admin", secondaryRole: "help_desk" }],
    ["a stand administrator with the secondary role kof_admin", { role: "stand_admin", secondaryRole: "kof_admin" }],
    ["stand staff", { role: "stand_staff" }],
    ["the help desk", { role: "help_desk" }],
  ])("answers 401 to %s", async (_case, account) => {
    await signIn(account);

    await expectUnauthorized(await refuseUnlessSysadmin());
  });

  it("answers 401 to a disabled sysadmin", async () => {
    await signIn({ role: "stand_admin", secondaryRole: "sysadmin", status: "disabled" });

    await expectUnauthorized(await refuseUnlessSysadmin());
  });
});

describe("csvDownload", () => {
  it("is a no-store attachment with a BOM", async () => {
    const response = csvDownload("a,b", "datos.csv");

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="datos.csv"');
    expect([...new Uint8Array(await response.arrayBuffer())].slice(0, 3)).toEqual([0xef, 0xbb, 0xbf]);
  });
});

async function signIn(fields: { role: string; secondaryRole?: string; status?: string }) {
  const account = await getPrisma().account.create({
    data: {
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: fields.role,
      secondaryRole: fields.secondaryRole,
      status: fields.status ?? "active",
      password: "scrypt$1$1$1$a$b",
      standId: fields.role.startsWith("stand_") ? standId : undefined,
    },
  });

  await createSession(account.id);
}

async function expectUnauthorized(response: Response | null) {
  expect(response?.status).toBe(401);
  expect(await response?.json()).toEqual({ error: "unauthorized" });
  expect(response?.headers.get("Cache-Control")).toBe("no-store");
}
