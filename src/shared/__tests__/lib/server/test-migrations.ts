import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS_DIRECTORY = path.join(process.cwd(), "prisma", "migrations");

// The whole chain, in order: a later migration that redefines a table drops the CHECKs and triggers of the earlier one.
export function applyMigrations(file: string) {
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
