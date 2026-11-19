import "server-only";
import { format } from "node:util";
import { isServerLogFallbackActive, logServerEvent } from "@shared/lib/server/server-log";
import type { ServerLogLevel } from "@shared/lib/server-log-types";

type CapturedMethod = "error" | "warn";

type CaptureTarget = Pick<Console, CapturedMethod>;

type WriteLog = typeof logServerEvent;

export interface ConsoleCaptureOptions {
  target?: CaptureTarget;
  write?: WriteLog;
  now?: () => number;
}

/** A storm of console errors cannot fill the table: past this many in a minute only the console prints them. */
export const MAX_CAPTURED_PER_MINUTE = 30;

const MINUTE_MS = 60_000;

const LEVELS: Record<CapturedMethod, ServerLogLevel> = { error: "error", warn: "warn" };

const WRAPPED = Symbol("serverLogCapture");

type Wrapped = ((...args: unknown[]) => void) & { [WRAPPED]?: (...args: unknown[]) => void };

/**
 * Records what server code prints with console.error and console.warn in `server_logs` (source `console`), and still
 * prints it. Installed once by instrumentation.ts. It cannot loop: the recording itself, and the console fallback of
 * the logger, are never captured. Returns a function that puts the original console back.
 */
export function installConsoleCapture(options: ConsoleCaptureOptions = {}): () => void {
  const target = options.target ?? console;
  const write = options.write ?? logServerEvent;
  const allows = createRateLimiter(options.now ?? Date.now);
  const methods: CapturedMethod[] = ["error", "warn"];

  const record = createRecorder(write, allows);
  const restores = methods.map((method) => wrapMethod(target, method, (args) => record(method, args)));

  return () => restores.forEach((restore) => restore());
}

function wrapMethod(target: CaptureTarget, method: CapturedMethod, capture: (args: unknown[]) => void) {
  const original: Wrapped = target[method];

  if (original[WRAPPED]) return () => undefined;

  const wrapped: Wrapped = function (...args) {
    original.apply(target, args);
    capture(args);
  };

  wrapped[WRAPPED] = original;
  target[method] = wrapped;

  return () => {
    target[method] = original;
  };
}

let isRecording = false;

function createRecorder(write: WriteLog, allows: () => boolean) {
  return function record(method: CapturedMethod, args: unknown[]): void {
    if (isRecording || isServerLogFallbackActive() || !allows()) return;

    isRecording = true;

    try {
      void write(LEVELS[method], "console", format(...args));
    } finally {
      isRecording = false;
    }
  };
}

function createRateLimiter(now: () => number): () => boolean {
  let windowStart = now();
  let count = 0;

  return function allows() {
    if (now() - windowStart >= MINUTE_MS) {
      windowStart = now();
      count = 0;
    }

    count += 1;

    return count <= MAX_CAPTURED_PER_MINUTE;
  };
}
