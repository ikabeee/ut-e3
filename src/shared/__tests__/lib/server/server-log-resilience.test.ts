/**
 * @jest-environment node
 */
import { installConsoleCapture } from "@shared/lib/server/console-capture";
import { deliverEmail, enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent } from "@shared/lib/server/server-log";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const holder: typeof globalThis & { prisma?: unknown } = globalThis;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("when the server_logs table is gone", () => {
  beforeEach(async () => {
    await getPrisma().$executeRawUnsafe('ALTER TABLE "server_logs" RENAME TO "server_logs_away"');
  });

  afterEach(async () => {
    await getPrisma().$executeRawUnsafe('ALTER TABLE "server_logs_away" RENAME TO "server_logs"');
  });

  it("deliverEmail still marks the email as sent", async () => {
    const consoleInfo = jest.spyOn(console, "info").mockImplementation(() => undefined);

    const id = await getPrisma().$transaction((tx) =>
      enqueueEmail(tx, { to: "ana@ut.mx", subject: "Recupera tu pasaporte", text: "Texto" }),
    );

    await expect(deliverEmail(id, async () => undefined, new Date())).resolves.toBeUndefined();

    const row = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id } });

    expect(row.sentAt).not.toBeNull();
    expect(consoleInfo).toHaveBeenCalledTimes(1);

    consoleInfo.mockRestore();
  });
});

describe("when the database directory does not exist", () => {
  it("resolves with exactly one fallback console line, and the capture does not loop on it", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const uninstall = installConsoleCapture();
    const savedClient = holder.prisma;
    const savedUrl = process.env.DATABASE_URL;

    holder.prisma = undefined;
    process.env.DATABASE_URL = "file:/this-directory-does-not-exist/app.db";

    await expect(logServerEvent("error", "worker", "Job failed")).resolves.toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0][0])).toContain("Job failed");

    holder.prisma = savedClient;
    process.env.DATABASE_URL = savedUrl;
    uninstall();
    consoleError.mockRestore();
  });
});
