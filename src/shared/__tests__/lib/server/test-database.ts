import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma/client";

const MIGRATIONS_DIRECTORY = path.join(process.cwd(), "prisma", "migrations");

export interface TestDatabase {
  url: string;
  remove: () => void;
}

export function createTestDatabase(): TestDatabase {
  const directory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-db-"));
  const file = path.join(directory, "test.db");

  applyMigrations(file);

  return {
    url: `file:${file}`,
    remove: () => rmSync(directory, { recursive: true, force: true }),
  };
}

export function createTestClient(database: TestDatabase) {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: database.url }) });
}

// The whole chain, in order: a later migration that redefines a table drops the CHECKs and triggers of the earlier one.
function applyMigrations(file: string) {
  const connection = new DatabaseSync(file);

  try {
    listMigrationFiles().forEach((migration) => connection.exec(readFileSync(migration, "utf8")));
  } finally {
    connection.close();
  }
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? [path.join(MIGRATIONS_DIRECTORY, entry.name, "migration.sql")] : []))
    .toSorted();
}
