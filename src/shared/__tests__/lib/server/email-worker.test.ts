/**
 * @jest-environment node
 */
import { clearJobs, getJobStatus } from "@shared/lib/server/background-jobs";
import { EMAIL_WORKER_JOB, startEmailWorker } from "@shared/lib/server/email-worker";

// A local .env may set SMTP_HOST: every test starts without it and sets it only when it needs it.
beforeEach(() => {
  delete process.env.SMTP_HOST;
});

afterEach(() => {
  clearJobs();
  delete process.env.SMTP_HOST;
});

describe("startEmailWorker", () => {
  it("does not start without SMTP_HOST: the emails wait in the outbox", () => {
    startEmailWorker();

    expect(getJobStatus(EMAIL_WORKER_JOB)).toBeNull();
  });

  it("starts the 60 s retry of the outbox as a job of the registry", () => {
    process.env.SMTP_HOST = "smtp.ut.mx";

    startEmailWorker();

    expect(getJobStatus(EMAIL_WORKER_JOB)).toMatchObject({ intervalMs: 60_000, isRunning: true });
  });
});
