import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { parseSqlStatement } from "@features/admin/lib/sql-statement";

const ERRORS = ADMIN_COPY.sql.errors;

describe("parseSqlStatement", () => {
  it.each([
    ["SELECT * FROM games", "read"],
    ["  select 1;  ", "read"],
    ["-- nota\nSELECT 1", "read"],
    ["EXPLAIN QUERY PLAN SELECT 1", "read"],
    ["WITH a AS (SELECT 1) SELECT * FROM a", "read"],
    ["WITH a AS (SELECT 1) DELETE FROM email_blocklist", "write"],
    ["WITH a(x) AS (SELECT 1), b AS (SELECT 2) INSERT INTO email_blocklist SELECT 'a' FROM a", "write"],
    ["WITH a AS (SELECT 1) UPDATE email_blocklist SET email = 'x'", "write"],
    ["INSERT INTO email_blocklist (email) VALUES ('a;b@ut.mx')", "write"],
    ["update games set name = 'x; drop table games' where id = 1", "write"],
    ["DELETE FROM email_blocklist", "write"],
    ["SELECT 1 /* ; DROP TABLE x */", "read"],
    ['WITH "select" AS (SELECT 1) DELETE FROM email_blocklist', "write"],
    ['WITH "delete" AS (SELECT 1) SELECT 1', "read"],
    ["WITH [insert] AS (SELECT 1) UPDATE email_blocklist SET email = 'x'", "write"],
    ["WITH `update` AS (SELECT 1) SELECT * FROM sqlite_master", "read"],
  ])("accepts %s as %s", (sql, kind) => {
    expect(parseSqlStatement(sql)).toMatchObject({ isValid: true, kind });
  });

  it.each([
    ["", ERRORS.empty],
    ["   \n ", ERRORS.empty],
    ["-- solo un comentario", ERRORS.empty],
    ["SELECT 1; SELECT 2", ERRORS.multiple],
    ["SELECT 1; DROP TABLE accounts", ERRORS.multiple],
    ["SELECT 1;;", ERRORS.multiple],
    ["ATTACH DATABASE 'otra.db' AS otra", ERRORS.forbidden("ATTACH")],
    ["DETACH DATABASE otra", ERRORS.forbidden("DETACH")],
    ["PRAGMA user_version", ERRORS.forbidden("PRAGMA")],
    ["VACUUM", ERRORS.forbidden("VACUUM")],
    ["CREATE TABLE x (a)", ERRORS.forbidden("CREATE")],
    ["DROP TABLE accounts", ERRORS.forbidden("DROP")],
    ["ALTER TABLE accounts ADD COLUMN x", ERRORS.forbidden("ALTER")],
    ["EXPLAIN PRAGMA user_version", ERRORS.notAllowed],
    ["REPLACE INTO email_blocklist (email) VALUES ('a')", ERRORS.notAllowed],
    ["BEGIN", ERRORS.notAllowed],
    ["WITH a AS (SELECT 1) DELETE FROM sqlite_sequence", ERRORS.protectedTable],
    ["SELECT load_extension('x')", ERRORS.loadExtension],
    ["SELECT \"load_extension\"('x')", ERRORS.loadExtension],
    ["SELECT [LOAD_EXTENSION]('x')", ERRORS.loadExtension],
    ["SELECT `Load_Extension`('x')", ERRORS.loadExtension],
    ['"select" 1', ERRORS.notAllowed],
    ['"delete" FROM email_blocklist', ERRORS.notAllowed],
    ["COMMIT", ERRORS.notAllowed],
    ["SAVEPOINT a", ERRORS.notAllowed],
    ["EXPLAIN ATTACH DATABASE 'otra.db' AS otra", ERRORS.notAllowed],
    ['DELETE FROM "audit_logs"', ERRORS.protectedTable],
    ["DELETE FROM [AUDIT_LOGS]", ERRORS.protectedTable],
    ["DELETE FROM `audit_logs`", ERRORS.protectedTable],
    ["DELETE FROM main.Audit_Logs", ERRORS.protectedTable],
    ['DELETE FROM "_prisma_migrations"', ERRORS.protectedTable],
    ["INSERT OR REPLACE INTO audit_logs (id) VALUES ('x')", ERRORS.protectedTable],
    ["INSERT INTO 'audit_logs' (id) VALUES ('x')", ERRORS.protectedTable],
    ['WITH "delete" AS (SELECT 1) DELETE FROM audit_logs', ERRORS.protectedTable],
    [
      'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n) SELECT i AS "limit" FROM n',
      ERRORS.recursiveWithoutLimit,
    ],
    [
      "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n) SELECT i FROM n WHERE 'limit' = 'limit'",
      ERRORS.recursiveWithoutLimit,
    ],
    ["INSERT INTO _prisma_migrations (id) VALUES ('x')", ERRORS.protectedTable],
    ['DELETE FROM main."_prisma_migrations"', ERRORS.protectedTable],
    ["UPDATE sqlite_master SET name = 'x'", ERRORS.protectedTable],
    ["DELETE FROM sqlite_sequence", ERRORS.protectedTable],
    ["INSERT INTO audit_logs (id) VALUES ('x')", ERRORS.protectedTable],
    ["WITH a AS (SELECT 1) SELECT * FROM a WHERE x IN (SELECT 1 FROM sqlite_x); DELETE FROM sqlite_x", ERRORS.multiple],
    ["WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n) SELECT i FROM n", ERRORS.recursiveWithoutLimit],
  ])("rejects %j", (sql, message) => {
    expect(parseSqlStatement(sql)).toEqual({ isValid: false, message });
  });

  it.each(["SELECT ';'", "SELECT 'a'' ; DELETE FROM x'", "SELECT 1; --", "SELECT [a;b]", 'SELECT "a;b" FROM t'])(
    "accepts %j as one read",
    (sql) => {
      expect(parseSqlStatement(sql)).toMatchObject({ isValid: true, kind: "read" });
    },
  );

  it("allows reading the protected tables and a recursive query with LIMIT", () => {
    expect(parseSqlStatement("SELECT name FROM sqlite_master")).toMatchObject({ isValid: true });
    expect(parseSqlStatement("SELECT * FROM _prisma_migrations")).toMatchObject({ isValid: true });
    expect(
      parseSqlStatement("WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n LIMIT 5) SELECT i FROM n"),
    ).toMatchObject({ isValid: true });
  });

  it("rejects a statement longer than the limit", () => {
    expect(parseSqlStatement(`SELECT '${"a".repeat(20_000)}'`)).toEqual({ isValid: false, message: ERRORS.tooLong });
  });
});
