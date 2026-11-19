import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma/client";
import { applyMigrations } from "@shared/__tests__/lib/server/test-migrations";

export interface TestDatabase {
  url: string;
  remove: () => void;
}

export function createTestDatabase(): TestDatabase {
  const directory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-db-"));
  const file = path.join(directory, "test.db");

  copyTemplateOrMigrate(file);

  return {
    url: `file:${file}`,
    remove: () => rmSync(directory, { recursive: true, force: true }),
  };
}

export function createTestClient(database: TestDatabase) {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: database.url }) });
}

// jest.global-setup.ts migrates once into a template; a run without it (a single file from an IDE) migrates on demand.
function copyTemplateOrMigrate(file: string) {
  const template = process.env.JEST_TEMPLATE_DATABASE;

  if (template && existsSync(template)) {
    copyFileSync(template, file);

    return;
  }

  applyMigrations(file);
}
