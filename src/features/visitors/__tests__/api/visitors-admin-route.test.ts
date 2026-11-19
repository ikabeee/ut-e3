/**
 * @jest-environment node
 */
import { GET } from "@features/visitors/api/visitors-admin-route";
import { VISITORS_EXPORT_PATH } from "@features/visitors/lib/visitors-links";
import { clearVisitorTables, createVisitor } from "@features/visitors/__tests__/lib/server/visitors-admin-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { OTHER_ROLES, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString("base64");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await clearVisitorTables();
});

const request = (search = "") => new Request(`http://localhost${VISITORS_EXPORT_PATH}${search}`);

describe(`GET ${VISITORS_EXPORT_PATH}`, () => {
  it.each(OTHER_ROLES)("answers 401 to %s and sends no data", async (role) => {
    await signInAs(role);
    await createVisitor({ gamertag: "Secret", email: "secret@ut.mx" });

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("secret@ut.mx");
  });

  it("gives the sysadmin a no-store CSV with the columns, and no PIN", async () => {
    await signInAs("sysadmin");
    await createVisitor({ gamertag: "Csv1", pin: "48271", fullName: "Ana Lopez", email: "ana@ut.mx" });

    const response = await GET(request());
    const body = (await response.text()).replace(/^\uFEFF/, "");
    const [header, row] = body.split("\r\n");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(header).toBe("Gamertag,Nombre,Correo,Registro,Visitas,Boletos,KOF,Excluido");
    expect(row).toMatch(/^Csv1,Ana Lopez,ana@ut\.mx,\d{4}-\d{2}-\d{2}T[\d:.]+Z,0,0,,No$/);
    expect(body).not.toContain("48271");
  });

  it("exports only what the search matches, in the sort asked", async () => {
    await signInAs("sysadmin");
    await createVisitor({ gamertag: "Keep1", createdAt: new Date("2026-11-01T10:00:00Z") });
    await createVisitor({ gamertag: "Keep2", createdAt: new Date("2026-11-02T10:00:00Z") });
    await createVisitor({ gamertag: "Drop" });

    const body = await (await GET(request("?q=keep&sort=oldest"))).text();

    expect(body.indexOf("Keep1")).toBeGreaterThan(-1);
    expect(body.indexOf("Keep1")).toBeLessThan(body.indexOf("Keep2"));
    expect(body).not.toContain("Drop");
  });

  it.each([
    ["=HYPERLINK(1)", "'=HYPERLINK(1)"],
    ["+cmd", "'+cmd"],
    ["-cmd", "'-cmd"],
    ["@SUM(A1)", "'@SUM(A1)"],
  ])("neutralizes a name that starts like a formula: %s", async (fullName, expected) => {
    await signInAs("sysadmin");
    await createVisitor({ gamertag: "Formula", fullName });

    expect(await (await GET(request())).text()).toContain(`,${expected},`);
  });

  it("neutralizes a formula in the gamertag and the email, and quotes commas and quotes", async () => {
    await signInAs("sysadmin");
    await createVisitor({ gamertag: "-minus", fullName: 'Ana "La, Pro"', email: "=1+1@ut.mx" });

    const body = await (await GET(request())).text();

    expect(body).toContain("'-minus,");
    expect(body).toContain('"Ana ""La, Pro"""');
    expect(body).toContain(",'=1+1@ut.mx,");
  });
});
