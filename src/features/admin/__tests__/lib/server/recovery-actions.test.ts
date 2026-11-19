/**
 * @jest-environment node
 */
import { statSync } from "node:fs";
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { PUBLIC_CACHE_TAGS } from "@features/admin/lib/server/public-cache-tags";
import {
  invalidateCachesAction,
  restartEmailWorkerAction,
  restartOverloadWatchAction,
  retryEmailsAction,
  runCheckpointAction,
  runQuickCheckAction,
  testSmtpAction,
} from "@features/admin/lib/recovery-actions";
import { OVERLOAD_WATCH_JOB } from "@features/admin/lib/server/overload-watch";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getJobStatus, startJob, clearJobs } from "@shared/lib/server/background-jobs";
import { EMAIL_WORKER_JOB } from "@shared/lib/server/email-worker";
import { getPrisma } from "@shared/lib/server/prisma";
import { getDatabasePath } from "@shared/lib/server/sqlite-file";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const nextServer = jest.requireActual<typeof NextServer>("next/server");

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

jest.spyOn(nextServer, "after").mockImplementation(() => undefined);

const COPY = ADMIN_COPY.recovery;

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// Port 1 refuses connections at once, so SMTP "is configured" and every send fails with the real error of the socket.
const UNREACHABLE_SMTP = {
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1",
  SMTP_USER: "usuario",
  SMTP_PASSWORD: "clave",
  SMTP_FROM: "UT <no-reply@ut.mx>",
};

const SMTP_VARIABLES = Object.keys(UNREACHABLE_SMTP);

let auditBaseline = 0;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  SMTP_VARIABLES.forEach((name) => delete process.env[name]);
  updateTag.mockClear();
  refresh.mockClear();
  await getPrisma().session.deleteMany();
  auditBaseline = await getPrisma().auditLog.count();
});

afterEach(() => clearJobs());

async function auditedActions(): Promise<string[]> {
  return (await newAuditEntries()).map((entry) => entry.action);
}

async function newAuditEntries() {
  const entries = await getPrisma().auditLog.findMany({ orderBy: { createdAt: "asc" } });

  return entries.slice(auditBaseline);
}

async function asSysadmin(): Promise<string> {
  return (await signInAs("sysadmin")) ?? "";
}

function useUnreachableSmtp(): void {
  Object.assign(process.env, UNREACHABLE_SMTP);
}

// The access tests run first: expectRefused needs a log that is still empty.
describe("access", () => {
  it.each(
    otherRoleCases({
      testSmtpAction,
      retryEmailsAction,
      restartEmailWorkerAction,
      restartOverloadWatchAction,
      runQuickCheckAction,
      runCheckpointAction,
      invalidateCachesAction,
    }),
  )("%s calling %s is sent to the login and does nothing", async (role, _name, action) => {
    await expectRefused(role, action);
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("invalidateCachesAction", () => {
  it("expires every public cache tag, refreshes the screen and audits it", async () => {
    const actorId = await asSysadmin();

    await expect(invalidateCachesAction()).resolves.toEqual({
      status: "done",
      message: COPY.cachesInvalidated(PUBLIC_CACHE_TAGS.length),
    });

    expect(updateTag.mock.calls.map(([tag]) => tag)).toEqual([...PUBLIC_CACHE_TAGS]);
    expect(refresh).toHaveBeenCalled();
    await expect(newAuditEntries()).resolves.toMatchObject([
      { actorId, action: "admin.recovery.invalidate_caches", detail: { tags: [...PUBLIC_CACHE_TAGS] } },
    ]);
  });
});

describe("runQuickCheckAction", () => {
  it("runs PRAGMA quick_check, reports that the database is healthy and audits the result", async () => {
    await asSysadmin();

    await expect(runQuickCheckAction()).resolves.toEqual({
      status: "done",
      message: COPY.quickCheckOk,
    });
    await expect(newAuditEntries()).resolves.toMatchObject([
      { action: "admin.recovery.quick_check", detail: { ok: true, messages: ["ok"] } },
    ]);
  });
});

describe("runCheckpointAction", () => {
  it("truncates the WAL file and audits it", async () => {
    await asSysadmin();
    await getPrisma().emailBlocklist.create({ data: { email: "respaldo@ut.mx" } });

    const walPath = `${getDatabasePath()}-wal`;
    const sizeBefore = statSync(walPath).size;

    expect(sizeBefore).toBeGreaterThan(0);

    const state = await runCheckpointAction();

    // The audit entry of the checkpoint is written after it, so the WAL is small again but not necessarily empty.
    expect(state).toEqual({ status: "done", message: COPY.checkpointDone });
    expect(statSync(walPath).size).toBeLessThan(sizeBefore);
    await expect(newAuditEntries()).resolves.toMatchObject([
      { action: "admin.recovery.checkpoint", detail: { isBusy: false, checkpointedFrames: expect.any(Number) } },
    ]);
  });
});

describe("restart actions", () => {
  it.each([
    {
      name: "restartEmailWorkerAction",
      action: restartEmailWorkerAction,
      job: EMAIL_WORKER_JOB,
      message: COPY.workerRestarted,
    },
    {
      name: "restartOverloadWatchAction",
      action: restartOverloadWatchAction,
      job: OVERLOAD_WATCH_JOB,
      message: COPY.watchRestarted,
    },
  ])("$name restarts its running job and audits it", async ({ action, job, message }) => {
    const run = jest.fn(async () => undefined);

    startJob({ name: job, intervalMs: 60_000, run });
    await asSysadmin();

    await expect(action()).resolves.toEqual({ status: "done", message });

    expect(getJobStatus(job)?.isRunning).toBe(true);
    await expect(newAuditEntries()).resolves.toMatchObject([{ action: "admin.recovery.restart", entityId: job }]);
  });

  it.each([
    ["restartEmailWorkerAction", restartEmailWorkerAction, COPY.workerNotStarted],
    ["restartOverloadWatchAction", restartOverloadWatchAction, COPY.watchNotStarted],
  ])("%s says so when the job never started and still audits the attempt", async (_name, action, message) => {
    await asSysadmin();

    await expect(action()).resolves.toEqual({ status: "error", message });
    await expect(auditedActions()).resolves.toEqual(["admin.recovery.restart"]);
  });
});

describe("testSmtpAction", () => {
  it("reports the exact configuration error when SMTP is not configured and audits the failure", async () => {
    await asSysadmin();

    await expect(testSmtpAction()).resolves.toEqual({
      status: "error",
      message: COPY.smtpFailed("Falta configurar la variable de entorno SMTP_HOST para el envío de correos."),
    });
    await expect(newAuditEntries()).resolves.toMatchObject([
      { action: "admin.recovery.smtp_test", detail: { ok: false } },
    ]);
  });

  it("reports the real error of the connection when the server does not answer", async () => {
    useUnreachableSmtp();
    await asSysadmin();

    const state = await testSmtpAction();

    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("ECONNREFUSED") });
    await expect(newAuditEntries()).resolves.toMatchObject([
      { action: "admin.recovery.smtp_test", detail: { ok: false, error: expect.stringContaining("ECONNREFUSED") } },
    ]);
  });
});

describe("retryEmailsAction", () => {
  it("refuses without SMTP and leaves the outbox as it was", async () => {
    await asSysadmin();

    const state = await retryEmailsAction();

    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("SMTP_HOST") });
  });

  it("runs the delivery now: a due email gets an attempt with the real error, and the retry is audited", async () => {
    useUnreachableSmtp();
    await asSysadmin();

    const row = await getPrisma().emailOutbox.create({ data: { to: "a@ut.mx", subject: "Hola", text: "texto" } });

    await expect(retryEmailsAction()).resolves.toEqual({
      status: "done",
      message: COPY.retried(0, 1),
    });

    await expect(getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).resolves.toMatchObject({
      attempts: 1,
      lastError: expect.stringContaining("ECONNREFUSED"),
      sentAt: null,
    });
    await expect(newAuditEntries()).resolves.toMatchObject([
      { action: "admin.recovery.retry_emails", detail: { sent: 0, pending: 1 } },
    ]);
  });
});
