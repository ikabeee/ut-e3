/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { runSqlAction } from "@features/admin/lib/sql-console-actions";
import { runSqlRead } from "@features/admin/lib/server/sql-console";
import type { SqlConsoleState } from "@features/admin/lib/types";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getPrisma } from "@shared/lib/server/prisma";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const COPY = ADMIN_COPY.sql;

const INSERT = "INSERT INTO email_blocklist (email) VALUES ('nuevo@ut.mx')";

const database = createTestDatabase();

let auditBaseline = 0;

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  updateTag.mockClear();
  await getPrisma().session.deleteMany();
  await getPrisma().emailBlocklist.deleteMany();
  await getPrisma().emailBlocklist.createMany({ data: [{ email: "uno@ut.mx" }, { email: "dos@ut.mx" }] });
  auditBaseline = await getPrisma().auditLog.count();
});

async function runAsSysadmin(sql: string, confirmation?: string): Promise<SqlConsoleState> {
  await signInAs("sysadmin");

  return runSqlAction(null, sqlForm(sql, confirmation));
}

function sqlForm(sql: string, confirmation?: string): FormData {
  const form = new FormData();

  form.set("sql", sql);

  if (confirmation !== undefined) form.set("confirmation", confirmation);

  return form;
}

async function blocklistCount(): Promise<number> {
  return getPrisma().emailBlocklist.count();
}

async function auditActions(): Promise<string[]> {
  return (await newAuditEntries()).map((entry) => entry.action);
}

// The audit log is append-only (triggers): each test looks only at the entries written after it started.
async function newAuditEntries() {
  const entries = await getPrisma().auditLog.findMany({ orderBy: { createdAt: "asc" } });

  return entries.slice(auditBaseline);
}

// The access tests run first: expectRefused needs a log that is still empty.
describe("access", () => {
  it.each(otherRoleCases({ runSqlAction }))(
    "%s calling %s is sent to the login and writes nothing",
    async (role, _n, action) => {
      await expectRefused(role, action);
    },
  );

  it.each(otherRoleCases({ runSqlAction }))("%s cannot run a confirmed write", async (role) => {
    await signInAs(role);

    await expect(runSqlAction(null, sqlForm(INSERT, "CONFIRMAR"))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    await expect(blocklistCount()).resolves.toBe(2);
    await expect(getPrisma().auditLog.count()).resolves.toBe(0);
  });
});

describe("rejected statements", () => {
  it.each([
    ["", COPY.errors.empty],
    ["SELECT 1; DELETE FROM email_blocklist", COPY.errors.multiple],
    ["DELETE FROM email_blocklist; DELETE FROM email_blocklist", COPY.errors.multiple],
    ["DROP TABLE email_blocklist", COPY.errors.forbidden("DROP")],
    ["PRAGMA writable_schema = 1", COPY.errors.forbidden("PRAGMA")],
    ["INSERT INTO _prisma_migrations (id) VALUES ('x')", COPY.errors.protectedTable],
  ])("%j is refused with its message and changes nothing", async (sql, message) => {
    await expect(runAsSysadmin(sql, "CONFIRMAR")).resolves.toEqual({ status: "error", message });
    await expect(blocklistCount()).resolves.toBe(2);
    await expect(auditActions()).resolves.toEqual([]);
  });
});

describe("reads", () => {
  it("returns the columns and rows, formatting null and blobs, and audits the statement only", async () => {
    const sql = "SELECT email, NULL AS vacio, x'0102' AS bytes FROM email_blocklist ORDER BY email";

    const state = await runAsSysadmin(sql);

    expect(state).toMatchObject({
      status: "read",
      result: { columns: ["email", "vacio", "bytes"], isTruncated: false },
    });
    expect(state.status === "read" && state.result.rows[0]).toEqual([
      { kind: "value", text: "dos@ut.mx" },
      { kind: "null", text: "NULL" },
      { kind: "blob", text: "[BLOB 2 bytes]" },
    ]);
    const entries = await newAuditEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ action: "admin.sql.read", detail: { statement: sql } });
    expect(JSON.stringify(entries[0].detail)).not.toContain("dos@ut.mx");
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("keeps at most 500 rows and says the result was truncated", async () => {
    const sql = "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n LIMIT 800) SELECT i FROM n";

    const state = await runAsSysadmin(sql);

    expect(state).toMatchObject({ status: "read", message: COPY.truncated(500), result: { isTruncated: true } });
    expect(state.status === "read" && state.result.rows).toHaveLength(500);
  });

  it("cannot write through a read: a WITH that deletes goes to review and changes nothing", async () => {
    const state = await runAsSysadmin("WITH a AS (SELECT 1) DELETE FROM email_blocklist");

    expect(state).toMatchObject({ status: "review", affectedRows: 2 });
    await expect(blocklistCount()).resolves.toBe(2);
  });

  it("a write disguised as a read by a quoted CTE name is only reviewed and changes nothing", async () => {
    const state = await runAsSysadmin('WITH "select" AS (SELECT 1) DELETE FROM email_blocklist');

    expect(state).toMatchObject({ status: "review", affectedRows: 2 });
    await expect(blocklistCount()).resolves.toBe(2);
  });

  it("a quoted CTE name called delete does not turn a read into a write", async () => {
    const state = await runAsSysadmin('WITH "delete" AS (SELECT 1) SELECT * FROM email_blocklist');

    expect(state).toMatchObject({ status: "read", result: { rows: expect.any(Array) } });
    await expect(auditActions()).resolves.toEqual(["admin.sql.read"]);
  });

  it("the read connection itself refuses a DELETE with SQLite's error and leaves the data unchanged", async () => {
    const actorId = await signInAs("sysadmin");

    await expect(runSqlRead(actorId ?? "", "DELETE FROM email_blocklist")).rejects.toMatchObject({
      code: "ERR_SQLITE_ERROR",
    });
    await expect(blocklistCount()).resolves.toBe(2);
  });

  it("answers a SQLite error with its message and nothing else", async () => {
    const state = await runAsSysadmin("SELECT * FROM tabla_que_no_existe");

    expect(state).toEqual({ status: "error", message: COPY.errors.sqlite("no such table: tabla_que_no_existe") });
  });
});

describe("writes", () => {
  it("the review says how many rows would change and modifies nothing", async () => {
    const state = await runAsSysadmin("DELETE FROM email_blocklist");

    expect(state).toEqual({
      status: "review",
      message: COPY.review(2),
      statement: "DELETE FROM email_blocklist",
      affectedRows: 2,
    });
    await expect(blocklistCount()).resolves.toBe(2);
    await expect(auditActions()).resolves.toEqual(["admin.sql.review"]);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it.each(["", "confirmar", "CONFIRMAR ", "SI"])("confirmation %j does nothing", async (confirmation) => {
    const state = await runAsSysadmin("DELETE FROM email_blocklist", confirmation);

    expect(state).toMatchObject({ status: "error", message: COPY.errors.confirmation });
    await expect(blocklistCount()).resolves.toBe(2);
    await expect(auditActions()).resolves.toEqual([]);
  });

  it("a confirmed write changes the data, audits the statement and the count, and refreshes the public caches", async () => {
    const state = await runAsSysadmin("DELETE FROM email_blocklist WHERE email = 'uno@ut.mx'", "CONFIRMAR");

    expect(state).toEqual({ status: "done", message: COPY.done(1), affectedRows: 1 });
    await expect(blocklistCount()).resolves.toBe(1);
    const entries = await newAuditEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: "admin.sql.write",
      detail: { statement: "DELETE FROM email_blocklist WHERE email = 'uno@ut.mx'", changes: 1 },
    });
    expect(updateTag.mock.calls.map(([tag]) => tag).toSorted()).toEqual([
      "event-settings",
      "games",
      "schedule",
      "sponsors",
      "visitor-pins",
    ]);
  });

  it("the review of an UPDATE leaves the rows identical and records only the review, with the statement", async () => {
    const sql = "UPDATE email_blocklist SET email = upper(email)";
    const before = await getPrisma().emailBlocklist.findMany({ orderBy: { email: "asc" } });

    const state = await runAsSysadmin(sql);

    expect(state).toMatchObject({ status: "review", affectedRows: 2 });
    await expect(getPrisma().emailBlocklist.findMany({ orderBy: { email: "asc" } })).resolves.toEqual(before);
    const entries = await newAuditEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ action: "admin.sql.review", detail: { statement: sql } });
  });

  it("a write that SQLite rejects rolls back with its audit entry and answers the error", async () => {
    const state = await runAsSysadmin("INSERT INTO email_blocklist (email) VALUES ('uno@ut.mx')", "CONFIRMAR");

    expect(state).toMatchObject({ status: "error" });
    expect(state.message).toContain("UNIQUE constraint failed");
    expect(state.message).not.toContain("prisma");
    await expect(blocklistCount()).resolves.toBe(2);
    await expect(auditActions()).resolves.toEqual([]);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("a review of a statement with a syntax error answers the error and writes nothing", async () => {
    const state = await runAsSysadmin("DELETE FROM");

    expect(state).toMatchObject({ status: "error" });
    await expect(blocklistCount()).resolves.toBe(2);
  });
});
