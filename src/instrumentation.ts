import type { Instrumentation } from "next";

// Records console.error and console.warn in the server logs (S4) and starts the background jobs: the purge of the
// logs older than 30 days, the watch of the load of the server for the automatic close of the public bracket (RF-74)
// and the retries of the email outbox (RNF-03); the first attempt of each email runs right after its request with
// after(). The intervals belong to the registry of @shared/lib/server/background-jobs, which /admin/recovery uses to
// report and restart them. It also bounds the shutdown, so SIGTERM always ends in an exit that closes SQLite
// (docs/deploy.md, "Restaurar").
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startShutdownDeadline } = await import("@shared/lib/server/shutdown-deadline");

  startShutdownDeadline();

  const { installConsoleCapture } = await import("@shared/lib/server/console-capture");
  const { startServerLogRetention } = await import("@shared/lib/server/server-log-retention");

  installConsoleCapture();
  startServerLogRetention();

  const { startOverloadWatch } = await import("@features/admin/lib/server/overload-watch");

  startOverloadWatch();

  const { startEmailWorker } = await import("@shared/lib/server/email-worker");

  startEmailWorker();
}

// An error that Next.js caught in a request becomes a production emergency email (S20), when EMERGENCY_MAIL is set.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { describeRequestError, sendEmergencyAlert } = await import("@shared/lib/server/emergency-alert");
  const { logRequestError } = await import("@shared/lib/server/request-error-log");

  await logRequestError(error, request, context);
  await sendEmergencyAlert(describeRequestError(error, request, context));
};
