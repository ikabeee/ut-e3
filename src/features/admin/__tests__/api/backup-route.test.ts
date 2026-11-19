/**
 * @jest-environment node
 */
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { GET } from "@features/admin/api/backup-route";
import { BACKUP_DIRECTORY_PREFIX } from "@features/admin/lib/server/database-maintenance";
import { OTHER_ROLES, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getPrisma } from "@shared/lib/server/prisma";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const scratch = mkdtempSync(path.join(tmpdir(), "ut-e3-test-restore-"));

let auditBaseline = 0;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
  rmSync(scratch, { recursive: true, force: true });
});

beforeEach(async () => {
  await getPrisma().session.deleteMany();
  auditBaseline = await getPrisma().auditLog.count();
});

// The temporary folder goes away when the stream closes, which is a moment after the last chunk was read.
async function waitForCleanup(): Promise<void> {
  for (let attempt = 0; attempt < 50 && leftoverBackups().length > 0; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function leftoverBackups(): string[] {
  return readdirSync(tmpdir()).filter((name) => name.startsWith(BACKUP_DIRECTORY_PREFIX));
}

async function newAuditEntries() {
  const entries = await getPrisma().auditLog.findMany({ orderBy: { createdAt: "asc" } });

  return entries.slice(auditBaseline);
}

describe("GET /api/admin/recovery/backup", () => {
  it.each(["anonymous", ...OTHER_ROLES.filter((role) => role !== "anonymous")])(
    "answers 401 to %s without a file, a temporary folder or an audit entry",
    async (role) => {
      await signInAs(role);

      const response = await GET();

      expect(response.status).toBe(401);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("Content-Disposition")).toBeNull();
      expect(leftoverBackups()).toEqual([]);
      await expect(newAuditEntries()).resolves.toEqual([]);
    },
  );

  it("streams a valid SQLite copy with the data to the sysadmin, no-store, audits it and removes the temp file", async () => {
    const actorId = await signInAs("sysadmin");

    await getPrisma().emailBlocklist.create({ data: { email: "respaldo@ut.mx" } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toMatch(/^attachment; filename="[^"/\\]+\.db"$/);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(Number(response.headers.get("Content-Length"))).toBe(bytes.byteLength);
    expect(new TextDecoder().decode(bytes.slice(0, 15))).toBe("SQLite format 3");

    const restored = path.join(scratch, "restored.db");

    writeFileSync(restored, bytes);

    const copy = new DatabaseSync(restored, { readOnly: true });

    try {
      expect(copy.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
      expect(copy.prepare("SELECT email FROM email_blocklist").all()).toEqual([{ email: "respaldo@ut.mx" }]);
    } finally {
      copy.close();
    }

    await waitForCleanup();

    expect(leftoverBackups()).toEqual([]);
    await expect(newAuditEntries()).resolves.toMatchObject([
      { actorId, action: "admin.recovery.backup_download", detail: { bytes: bytes.byteLength } },
    ]);
  });

  it("removes the temporary file when the download is cancelled halfway", async () => {
    await signInAs("sysadmin");

    const response = await GET();

    await response.body?.cancel();
    await waitForCleanup();

    expect(leftoverBackups()).toEqual([]);
  });

  it("answers 500 with a message and leaves nothing behind when the backup fails", async () => {
    await signInAs("sysadmin");

    const previous = process.env.DATABASE_URL;

    process.env.DATABASE_URL = "file:/no/such/folder/app.db";

    try {
      const response = await GET();

      expect(response.status).toBe(500);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      process.env.DATABASE_URL = previous;
    }

    expect(leftoverBackups()).toEqual([]);
  });
});
