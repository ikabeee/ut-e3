import "server-only";

/** Docker waits 30 s (stop_grace_period) before SIGKILL; the process must exit, and close SQLite, before that. */
export const SHUTDOWN_DEADLINE_MS = 20_000;

const SIGTERM_EXIT_CODE = 143;

type Exit = (code: number) => void;

/**
 * On SIGTERM `next start` stops accepting connections and exits once the open ones finish, but under load a polling
 * client keeps its keep-alive connection busy and Docker ends up killing the process with SIGKILL, which skips the
 * "exit" handler that closes SQLite (app.db-wal and app.db-shm stay). This exits on its own before Docker's deadline.
 */
export function startShutdownDeadline(
  exit: Exit = (code) => process.exit(code),
  deadlineMs = SHUTDOWN_DEADLINE_MS,
): void {
  process.once("SIGTERM", () => scheduleForcedExit(exit, deadlineMs));
}

export function scheduleForcedExit(exit: Exit, deadlineMs: number): void {
  // unref: when every connection closes first, `next start` exits by itself and this timer does not hold it.
  setTimeout(() => exit(SIGTERM_EXIT_CODE), deadlineMs).unref();
}
