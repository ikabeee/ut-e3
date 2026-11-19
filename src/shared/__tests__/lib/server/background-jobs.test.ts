/**
 * @jest-environment node
 */
import {
  getJobStatus,
  restartJob,
  startJob,
  clearJobs,
  trackRun,
  type JobDefinition,
} from "@shared/lib/server/background-jobs";

const INTERVAL_MS = 1000;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  clearJobs();
  jest.useRealTimers();
});

function buildJob(overrides: Partial<JobDefinition> = {}): JobDefinition {
  return { name: "test-job", intervalMs: INTERVAL_MS, run: async () => undefined, ...overrides };
}

describe("startJob", () => {
  it("runs on every interval and reports its last run and that it is running", async () => {
    const run = jest.fn(async () => undefined);

    startJob(buildJob({ run }));

    expect(getJobStatus("test-job")).toEqual({
      name: "test-job",
      intervalMs: INTERVAL_MS,
      isRunning: true,
      lastRunAt: null,
      lastError: null,
    });

    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(run).toHaveBeenCalledTimes(2);
    expect(getJobStatus("test-job")?.lastRunAt).toBe(new Date(Date.now()).toISOString());
  });

  it("records the error, hands it to onError and keeps running; a later success clears it", async () => {
    const onError = jest.fn();
    const run = jest.fn().mockRejectedValueOnce(new Error("SMTP caído")).mockResolvedValue(undefined);

    startJob(buildJob({ run, onError }));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(getJobStatus("test-job")).toMatchObject({ isRunning: true, lastError: "SMTP caído" });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "SMTP caído" }));

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(getJobStatus("test-job")?.lastError).toBeNull();
  });

  it("skips a tick while the previous run is still going", async () => {
    let finish: () => void = () => undefined;
    const run = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));

    startJob(buildJob({ run }));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(run).toHaveBeenCalledTimes(1);

    finish();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("replaces a job registered twice instead of running two timers", async () => {
    const first = jest.fn(async () => undefined);
    const second = jest.fn(async () => undefined);

    startJob(buildJob({ run: first }));
    startJob(buildJob({ run: second }));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("restartJob", () => {
  it("clears the timer and starts a new one: the next run is a full interval away and never doubles", async () => {
    const run = jest.fn(async () => undefined);

    startJob(buildJob({ run }));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 0.9);

    expect(restartJob("test-job")).toBe(true);

    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 0.9);

    expect(run).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 0.2);

    expect(run).toHaveBeenCalledTimes(1);
    expect(getJobStatus("test-job")?.isRunning).toBe(true);
  });

  it("answers false for a job that was never started", () => {
    expect(restartJob("ghost")).toBe(false);
    expect(getJobStatus("ghost")).toBeNull();
  });
});

describe("trackRun", () => {
  it("returns the result of the work and records the run", async () => {
    startJob(buildJob());

    await expect(trackRun("test-job", async () => 3)).resolves.toBe(3);

    expect(getJobStatus("test-job")).toMatchObject({ lastRunAt: expect.any(String), lastError: null });
  });

  it("records the error and rethrows it so the caller can show it", async () => {
    startJob(buildJob());

    await expect(
      trackRun("test-job", async () => {
        throw new Error("535 mala contraseña");
      }),
    ).rejects.toThrow("535 mala contraseña");

    expect(getJobStatus("test-job")?.lastError).toBe("535 mala contraseña");
  });

  it("just runs the work for a job that was never started", async () => {
    await expect(trackRun("ghost", async () => "ok")).resolves.toBe("ok");
  });
});
