/**
 * @jest-environment node
 */
import { readdirSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIRECTORY = path.join(process.cwd(), "prisma", "migrations");

// Prisma applies the migrations in folder-name order. Two folders with the same timestamp are ordered by their suffix,
// so a branch merged first can apply them in a different order than the one they were written for.
describe("migration history", () => {
  it("gives every migration its own timestamp", () => {
    expect(findRepeatedTimestamps(listMigrationNames())).toEqual([]);
  });
});

function listMigrationNames(): string[] {
  return readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function findRepeatedTimestamps(names: string[]): string[] {
  const timestamps = names.map((name) => name.split("_")[0]);

  return [...new Set(timestamps.filter((timestamp, index) => timestamps.indexOf(timestamp) !== index))];
}
