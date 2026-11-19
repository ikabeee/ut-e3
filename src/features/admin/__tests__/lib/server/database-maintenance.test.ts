/**
 * @jest-environment node
 */
import { existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { createBackup, BACKUP_DIRECTORY_PREFIX } from "@features/admin/lib/server/database-maintenance";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getPrisma } from "@shared/lib/server/prisma";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

function leftoverBackups(): string[] {
  return readdirSync(tmpdir()).filter((name) => name.startsWith(BACKUP_DIRECTORY_PREFIX));
}

describe("createBackup", () => {
  it("writes a snapshot with the data in a private temporary folder and removes it on cleanup", async () => {
    await getPrisma().emailBlocklist.create({ data: { email: "datos@ut.mx" } });

    const backup = await createBackup();

    expect(backup.bytes).toBeGreaterThan(0);
    expect(existsSync(backup.directory)).toBe(true);

    await backup.cleanup();

    expect(existsSync(backup.directory)).toBe(false);
    expect(leftoverBackups()).toEqual([]);
  });

  it("leaves no folder behind when the database cannot be read", async () => {
    const previous = process.env.DATABASE_URL;

    process.env.DATABASE_URL = "file:/no/such/folder/app.db";

    try {
      await expect(createBackup()).rejects.toThrow();
    } finally {
      process.env.DATABASE_URL = previous;
    }

    expect(leftoverBackups()).toEqual([]);
  });
});
