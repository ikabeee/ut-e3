/**
 * @jest-environment node
 */
import os from "node:os";
import path from "node:path";
import { getDatabaseFreeBytes } from "@shared/lib/server/disk-space";

describe("getDatabaseFreeBytes", () => {
  it("reads the free space of the folder of the database file", async () => {
    const free = await getDatabaseFreeBytes(`file:${path.join(os.tmpdir(), "app.db")}`);

    expect(free).toBeGreaterThan(0);
  });

  it("gives null without a database or with a folder that does not exist", async () => {
    await expect(getDatabaseFreeBytes("")).resolves.toBeNull();
    await expect(getDatabaseFreeBytes("file:/no/such/folder/app.db")).resolves.toBeNull();
  });
});
