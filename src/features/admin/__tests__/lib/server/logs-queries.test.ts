/**
 * @jest-environment node
 */
import { parseAuditLogFilters, parseServerLogFilters, LOGS_PAGE_SIZE } from "@features/admin/lib/logs-filters";
import { getAuditLogPage, getServerLogPage } from "@features/admin/lib/server/logs-queries";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

function at(day: string): Date {
  return new Date(`${day}:00.000Z`);
}

describe("getServerLogPage", () => {
  beforeAll(async () => {
    await getPrisma().serverLog.createMany({
      data: [
        { level: "error", source: "request", message: "Boom in /api/x", createdAt: at("2026-11-10T12:00") },
        { level: "warn", source: "email", message: "Email failed: Hola", createdAt: at("2026-11-11T12:00") },
        { level: "info", source: "email", message: "Email sent: Hola", createdAt: at("2026-11-12T12:00") },
        { level: "error", source: "worker", message: "Outbox failed", createdAt: at("2026-11-13T12:00") },
      ],
    });
  });

  async function messages(params: Record<string, string>): Promise<string[]> {
    const page = await getServerLogPage(parseServerLogFilters(params));

    return page.rows.map((row) => row.message);
  }

  it("lists the newest first", async () => {
    await expect(messages({})).resolves.toEqual([
      "Outbox failed",
      "Email sent: Hola",
      "Email failed: Hola",
      "Boom in /api/x",
    ]);
  });

  it.each([
    [{ level: "error" }, ["Outbox failed", "Boom in /api/x"]],
    [{ source: "email" }, ["Email sent: Hola", "Email failed: Hola"]],
    [{ level: "warn", source: "email" }, ["Email failed: Hola"]],
    [{ q: "failed" }, ["Outbox failed", "Email failed: Hola"]],
    [{ q: "FAILED", level: "error" }, ["Outbox failed"]],
    [{ from: "2026-11-11", to: "2026-11-12" }, ["Email sent: Hola", "Email failed: Hola"]],
    [{ from: "2026-11-13" }, ["Outbox failed"]],
    [{ to: "2026-11-10" }, ["Boom in /api/x"]],
    [{ q: "nothing like this" }, []],
  ])("filters by %j", async (params, expected) => {
    await expect(messages(params)).resolves.toEqual(expected);
  });

  it("maps a row for the screen: ISO date, level, source and details", async () => {
    const page = await getServerLogPage(parseServerLogFilters({ level: "warn" }));

    expect(page.rows[0]).toEqual({
      id: expect.any(String),
      createdAt: "2026-11-11T12:00:00.000Z",
      level: "warn",
      source: "email",
      message: "Email failed: Hola",
      details: null,
    });
  });
});

describe("pagination", () => {
  beforeAll(async () => {
    await getPrisma().serverLog.deleteMany();
    await getPrisma().serverLog.createMany({
      data: Array.from({ length: LOGS_PAGE_SIZE * 2 + 1 }, (_, index) => ({
        level: "info",
        source: "worker",
        message: `row ${index}`,
        createdAt: new Date(Date.UTC(2026, 10, 1, 0, index)),
      })),
    });
  });

  it("gives 25 rows per page with the total and the page count", async () => {
    const page = await getServerLogPage(parseServerLogFilters({ page: "2" }));

    expect(page).toMatchObject({ total: 51, page: 2, pageCount: 3 });
    expect(page.rows).toHaveLength(LOGS_PAGE_SIZE);
  });

  it("brings a page past the end back to the last one", async () => {
    const page = await getServerLogPage(parseServerLogFilters({ page: "99" }));

    expect(page).toMatchObject({ page: 3, pageCount: 3 });
    expect(page.rows).toHaveLength(1);
  });

  it("is page 1 of 1 with no rows", async () => {
    const page = await getServerLogPage(parseServerLogFilters({ q: "no match" }));

    expect(page).toEqual({ rows: [], total: 0, page: 1, pageCount: 1 });
  });
});

describe("getAuditLogPage", () => {
  beforeAll(async () => {
    const [ana, luis] = await Promise.all([
      getPrisma().account.create({
        data: { email: "ana@ut.mx", name: "Ana Pérez", role: "sysadmin", status: "active", password: "hash" },
      }),
      getPrisma().account.create({
        data: { email: "luis@ut.mx", name: "Luis Gómez", role: "sysadmin", status: "active", password: "hash" },
      }),
    ]);

    await getPrisma().auditLog.createMany({
      data: [
        {
          actorId: ana.id,
          action: "admin.sql.read",
          entityType: "sql_console",
          entityId: "sql",
          detail: { a: 1 },
          createdAt: at("2026-11-10T12:00"),
        },
        {
          actorId: luis.id,
          action: "schedule_item.update",
          entityType: "schedule_item",
          entityId: "item-9",
          detail: {},
          createdAt: at("2026-11-11T12:00"),
        },
        {
          actorId: null,
          action: "kof.public_bracket.close",
          entityType: "kof_tournament",
          entityId: "1",
          detail: {},
          createdAt: at("2026-11-12T12:00"),
        },
      ],
    });
  });

  async function actions(params: Record<string, string>): Promise<string[]> {
    const page = await getAuditLogPage(parseAuditLogFilters(params));

    return page.rows.map((row) => row.action);
  }

  it.each([
    [{}, ["kof.public_bracket.close", "schedule_item.update", "admin.sql.read"]],
    [{ actor: "ana" }, ["admin.sql.read"]],
    [{ actor: "luis@ut" }, ["schedule_item.update"]],
    [{ action: "sql" }, ["admin.sql.read"]],
    [{ entity: "item-9" }, ["schedule_item.update"]],
    [{ entity: "kof_" }, ["kof.public_bracket.close"]],
    [{ from: "2026-11-11", to: "2026-11-11" }, ["schedule_item.update"]],
    [{ actor: "ana", action: "schedule" }, []],
  ])("filters by %j", async (params, expected) => {
    await expect(actions(params)).resolves.toEqual(expected);
  });

  it("shows who did it, or nobody for an automatic change, and the detail", async () => {
    const page = await getAuditLogPage(parseAuditLogFilters({}));

    expect(page.rows.map((row) => row.actor)).toEqual([
      null,
      { name: "Luis Gómez", email: "luis@ut.mx" },
      { name: "Ana Pérez", email: "ana@ut.mx" },
    ]);
    expect(page.rows[2].detail).toBe('{\n  "a": 1\n}');
    expect(page.rows[1].detail).toBeNull();
  });
});
