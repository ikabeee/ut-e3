/**
 * @jest-environment node
 */
import { OVERLOAD_WATCH_JOB, startOverloadWatch } from "@features/admin/lib/server/overload-watch";
import { SAMPLE_INTERVAL_MS } from "@features/admin/lib/overload-rule";
import { clearJobs, getJobStatus } from "@shared/lib/server/background-jobs";

afterEach(() => clearJobs());

describe("startOverloadWatch", () => {
  it("registers the watch as a job that samples every SAMPLE_INTERVAL_MS", () => {
    startOverloadWatch();

    expect(getJobStatus(OVERLOAD_WATCH_JOB)).toMatchObject({ intervalMs: SAMPLE_INTERVAL_MS, isRunning: true });
  });
});
