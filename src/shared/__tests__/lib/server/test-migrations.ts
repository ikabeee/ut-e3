import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS_DIRECTORY = path.join(process.cwd(), "prisma", "migrations");

// The whole chain, in order: a later migration that redefines a table drops the CHECKs and triggers of the earlier one.
export function applyMigrations(file: string) {
  runMigrations(file, () => true);
}

/** Applies the migrations whose folder sorts before `name`, to load data the way an older database had it. */
export function applyMigrationsBefore(file: string, name: string) {
  runMigrations(file, (migration) => migration < path.join(MIGRATIONS_DIRECTORY, name));
}

/** Applies one migration, by its folder name, on top of a database that has the earlier ones. */
export function applyMigration(file: string, name: string) {
  runMigrations(file, (migration) => migration === path.join(MIGRATIONS_DIRECTORY, name, "migration.sql"));
}

function runMigrations(file: string, include: (migration: string) => boolean) {
  const connection = new DatabaseSync(file);

  try {
    listMigrationFiles()
      .filter(include)
      .forEach((migration) => connection.exec(readFileSync(migration, "utf8")));
  } finally {
    connection.close();
  }
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? [path.join(MIGRATIONS_DIRECTORY, entry.name, "migration.sql")] : []))
    .toSorted();
}
