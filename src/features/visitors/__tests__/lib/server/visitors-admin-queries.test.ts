/**
 * @jest-environment node
 */
import {
  getRegistrationsPerDay,
  listAdminVisitors,
  listAdminVisitorsForExport,
} from "@features/visitors/lib/server/visitors-admin-queries";
import { VISITORS_PAGE_SIZE } from "@features/visitors/lib/visitors-admin";
import { clearVisitorTables, createVisitor } from "@features/visitors/__tests__/lib/server/visitors-admin-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString("base64");

const ALL = { query: "", page: 1, sort: "newest" } as const;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await clearVisitorTables();
});

describe("listAdminVisitors", () => {
  it("finds by gamertag, name or email without caring about case", async () => {
    await createVisitor({ gamertag: "Alpha", fullName: "Ana Lopez", email: "ana@uno.mx" });
    await createVisitor({ gamertag: "Beta", fullName: "Beto Ruiz", email: "beto@dos.mx" });

    const names = async (query: string) => (await listAdminVisitors({ ...ALL, query })).rows.map((row) => row.gamertag);

    await expect(names("alph")).resolves.toEqual(["Alpha"]);
    await expect(names("RUIZ")).resolves.toEqual(["Beta"]);
    await expect(names("@uno.mx")).resolves.toEqual(["Alpha"]);
    await expect(names("nadie")).resolves.toEqual([]);
  });

  it("treats % and _ as plain characters", async () => {
    await createVisitor({ gamertag: "Alpha" });
    await createVisitor({ gamertag: "Under_score" });

    const percent = await listAdminVisitors({ ...ALL, query: "%" });
    const underscore = await listAdminVisitors({ ...ALL, query: "r_s" });

    expect(percent.rows).toEqual([]);
    expect(underscore.rows.map((row) => row.gamertag)).toEqual(["Under_score"]);
  });

  it("pages by 50 and reports the total", async () => {
    for (let index = 1; index <= 120; index += 1) {
      await createVisitor({ gamertag: `Player${index}`, createdAt: new Date(Date.UTC(2026, 10, 1, 0, index)) });
    }

    const first = await listAdminVisitors(ALL);
    const last = await listAdminVisitors({ ...ALL, page: 3 });

    expect(first).toMatchObject({ total: 120, page: 1, pageCount: 3 });
    expect(first.rows).toHaveLength(VISITORS_PAGE_SIZE);
    expect(first.rows[0].gamertag).toBe("Player120");
    expect(last.rows).toHaveLength(20);
    expect(last.rows.at(-1)?.gamertag).toBe("Player1");
  });

  it("sorts by registration date in both directions", async () => {
    await createVisitor({ gamertag: "Old", createdAt: new Date("2026-11-01T10:00:00Z") });
    await createVisitor({ gamertag: "New", createdAt: new Date("2026-11-02T10:00:00Z") });

    const oldest = await listAdminVisitors({ ...ALL, sort: "oldest" });
    const newest = await listAdminVisitors({ ...ALL, sort: "newest" });

    expect(oldest.rows.map((row) => row.gamertag)).toEqual(["Old", "New"]);
    expect(newest.rows.map((row) => row.gamertag)).toEqual(["New", "Old"]);
  });

  it("counts valid visits and active tickets, gives the KOF status and the exclusion, and never the PIN", async () => {
    const visitor = await createVisitor({ gamertag: "Busy", pin: "48271" });
    const stand = await getPrisma().stand.create({ data: { zone: "B", number: 1, studio: 2, groupCode: "202" } });
    const stand2 = await getPrisma().stand.create({ data: { zone: "B", number: 2, studio: 2, groupCode: "202" } });

    const sysadmin = await getPrisma().account.create({
      data: { email: "queries@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "x" },
    });

    await getPrisma().checkIn.create({ data: { visitorId: visitor.id, standId: stand.id } });
    await getPrisma().checkIn.create({
      data: {
        visitorId: visitor.id,
        standId: stand2.id,
        annulledAt: new Date(),
        annulledReason: "x",
        annulledById: sysadmin.id,
      },
    });
    await getPrisma().raffleTicket.createMany({
      data: [
        { visitorId: visitor.id, milestone: 9, status: "active" },
        { visitorId: visitor.id, milestone: 18, status: "voided" },
      ],
    });
    await getPrisma().tournamentEntry.create({
      data: { visitorId: visitor.id, channel: "onsite", status: "checked_in", checkedInAt: new Date() },
    });
    await getPrisma().visitor.update({
      where: { id: visitor.id },
      data: { excludedAt: new Date(), excludedReason: "Fraude" },
    });

    const page = await listAdminVisitors(ALL);

    expect(page.rows[0]).toMatchObject({
      gamertag: "Busy",
      fullName: "Nombre Busy",
      email: "busy@example.com",
      visitCount: 1,
      activeTickets: 1,
      tournamentStatus: "checked_in",
      isExcluded: true,
    });
    expect(JSON.stringify(page)).not.toContain("48271");
    expect(JSON.stringify(page)).not.toContain("pin");
    expect(JSON.stringify(page)).not.toContain("Fraude");
  });

  it("shows no KOF status and no exclusion for a plain passport", async () => {
    await createVisitor({ gamertag: "Plain" });

    const [row] = (await listAdminVisitors(ALL)).rows;

    expect(row).toMatchObject({ visitCount: 0, activeTickets: 0, tournamentStatus: null, isExcluded: false });
  });
});

describe("listAdminVisitorsForExport", () => {
  it("returns every match of the filter, not one page", async () => {
    for (let index = 1; index <= 60; index += 1) {
      await createVisitor({ gamertag: `Exp${index}` });
    }

    await createVisitor({ gamertag: "Other" });

    await expect(listAdminVisitorsForExport({ ...ALL, query: "Exp" })).resolves.toHaveLength(60);
  });
});

describe("getRegistrationsPerDay", () => {
  it("counts per day of Cancun, oldest first", async () => {
    // 04:30 UTC is still the day before in Cancun (UTC-5).
    await createVisitor({ gamertag: "Late", createdAt: new Date("2026-11-20T04:30:00Z") });
    await createVisitor({ gamertag: "Same1", createdAt: new Date("2026-11-20T15:00:00Z") });
    await createVisitor({ gamertag: "Same2", createdAt: new Date("2026-11-20T20:00:00Z") });

    await expect(getRegistrationsPerDay()).resolves.toEqual([
      { day: "2026-11-19", count: 1 },
      { day: "2026-11-20", count: 2 },
    ]);
  });
});
