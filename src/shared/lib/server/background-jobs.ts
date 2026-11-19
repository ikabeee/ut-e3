import "server-only";

export interface JobDefinition {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
  /** Called when `run` fails, after the failure was recorded; the job keeps its interval. */
  onError?: (cause: unknown) => void | Promise<void>;
}

export interface JobStatus {
  name: string;
  intervalMs: number;
  /** True while the interval is active; false when it was stopped and nobody restarted it. */
  isRunning: boolean;
  lastRunAt: string | null;
  lastError: string | null;
}

interface RegisteredJob {
  definition: JobDefinition;
  timer: NodeJS.Timeout | null;
  isBusy: boolean;
  lastRunAt: Date | null;
  lastError: string | null;
}

// The server keeps instrumentation.ts, the Server Actions and the Route Handlers in separate bundles: the registry lives
// on globalThis, like the Prisma client, so all of them see the same timers.
const processGlobal: typeof globalThis & { backgroundJobs?: Map<string, RegisteredJob> } = globalThis;

/**
 * Registers the interval of a background job and starts it, replacing a job with the same name. The timer does not
 * keep the process alive, and a tick is skipped while the previous run is still going.
 */
export function startJob(definition: JobDefinition): void {
  const previous = getJobs().get(definition.name);

  if (previous) stopTimer(previous);

  const job: RegisteredJob = { definition, timer: null, isBusy: false, lastRunAt: null, lastError: null };

  getJobs().set(definition.name, job);
  startTimer(job);
}

/** Clears the interval of the job and starts a new one, so the next run is a full interval away. False if unknown. */
export function restartJob(name: string): boolean {
  const job = getJobs().get(name);

  if (!job) return false;

  stopTimer(job);
  startTimer(job);

  return true;
}

export function getJobStatus(name: string): JobStatus | null {
  const job = getJobs().get(name);

  if (!job) return null;

  return {
    name,
    intervalMs: job.definition.intervalMs,
    isRunning: job.timer !== null,
    lastRunAt: job.lastRunAt?.toISOString() ?? null,
    lastError: job.lastError,
  };
}

/**
 * Runs `work` on behalf of a job, outside its interval ("retry now"): the run and its error are recorded as the job's
 * own, and the error is rethrown so the caller can show it. A job that was never started just runs the work.
 */
export async function trackRun<Result>(name: string, work: () => Promise<Result>): Promise<Result> {
  const job = getJobs().get(name);

  try {
    const result = await work();

    if (job) recordRun(job, null);

    return result;
  } catch (cause) {
    if (job) recordRun(job, describeFailure(cause));

    throw cause;
  }
}

/** Stops every interval and forgets the jobs; for tests, which start each case with an empty registry. */
export function clearJobs(): void {
  getJobs().forEach(stopTimer);
  getJobs().clear();
}

function getJobs(): Map<string, RegisteredJob> {
  processGlobal.backgroundJobs ??= new Map();

  return processGlobal.backgroundJobs;
}

function startTimer(job: RegisteredJob): void {
  job.timer = setInterval(() => void tick(job), job.definition.intervalMs);
  job.timer.unref();
}

function stopTimer(job: RegisteredJob): void {
  if (job.timer) clearInterval(job.timer);

  job.timer = null;
}

async function tick(job: RegisteredJob): Promise<void> {
  if (job.isBusy) return;

  job.isBusy = true;

  try {
    await job.definition.run();
    recordRun(job, null);
  } catch (cause) {
    recordRun(job, describeFailure(cause));
    await job.definition.onError?.(cause);
  } finally {
    job.isBusy = false;
  }
}

function recordRun(job: RegisteredJob, failure: string | null): void {
  job.lastRunAt = new Date();
  job.lastError = failure;
}

function describeFailure(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
