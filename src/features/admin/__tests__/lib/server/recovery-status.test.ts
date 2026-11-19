/**
 * @jest-environment node
 */
import { getRecoveryStatus } from "@features/admin/lib/server/recovery-status";
import { createEventSettings } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { startJob, clearJobs } from "@shared/lib/server/background-jobs";
import { EMAIL_WORKER_JOB } from "@shared/lib/server/email-worker";
import { getPrisma } from "@shared/lib/server/prisma";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(createEventSettings);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// A local .env may set SMTP_HOST: every test starts without it and sets it only when it needs it.
beforeEach(() => {
  delete process.env.SMTP_HOST;
});

afterEach(() => {
  clearJobs();
  delete process.env.SMTP_HOST;
});

describe("getRecoveryStatus", () => {
  it("reports SMTP as not configured, no jobs and the sizes of the database files", async () => {
    const status = await getRecoveryStatus();

    expect(status.mail).toMatchObject({ smtpHost: null, worker: null });
    expect(status.overloadWatch).toBeNull();
    expect(status.logRetention).toBeNull();
    expect(status.database.databaseBytes).toBeGreaterThan(0);
    expect(status.database.walBytes).toBeGreaterThanOrEqual(0);
    expect(status.database.freeBytes).toBeGreaterThan(0);
    expect(status.publicBracketEnabled).toBe(true);
  });

  it("gives the host only, the worker state, the outbox counts and the last failure", async () => {
    process.env.SMTP_HOST = "smtp.ut.mx";
    Object.assign(process.env, { SMTP_PASSWORD: "clave" });
    startJob({ name: EMAIL_WORKER_JOB, intervalMs: 60_000, run: async () => undefined });
    await getPrisma().emailOutbox.create({
      data: { to: "a@ut.mx", subject: "x", text: "t", attempts: 2, lastError: "421 Servicio no disponible" },
    });
    await getPrisma().emailOutbox.create({
      data: { to: "b@ut.mx", subject: "y", text: "", sentAt: new Date("2026-11-20T18:00:00.000Z") },
    });

    const status = await getRecoveryStatus();

    expect(status.mail).toMatchObject({
      smtpHost: "smtp.ut.mx",
      worker: { isRunning: true, lastRunAt: null },
      outbox: { sent: 1, pending: 1, failed: 0 },
      lastSentAt: "2026-11-20T18:00:00.000Z",
      lastFailure: "421 Servicio no disponible",
    });
    expect(JSON.stringify(status)).not.toContain("clave");

    delete process.env.SMTP_PASSWORD;
  });
});
