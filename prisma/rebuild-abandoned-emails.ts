import { loadEnvConfig } from "@next/env";
import {
  rebuildAbandonedEmails,
  type AbandonedRebuildResult,
  type KindCounts,
} from "@features/admin/lib/server/abandoned-email-rebuild";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npx tsx --conditions=react-server prisma/rebuild-abandoned-emails.ts`, when the sysadmin cannot reach
// "Rehacer" in /admin/emails (S9 of odd/tasks/staff-dual-roles.md). It makes again every abandoned email of a kind that
// can be rebuilt, with new links and PINs, and leaves them queued for the throttled mail worker: nothing is sent here.
// Safe to run again: a rebuilt row is no longer abandoned. The exit code is 1 when any row failed.
loadEnvConfig(process.cwd());

rebuildAndReport().catch(reportFailure);

async function rebuildAndReport(): Promise<void> {
  try {
    const result = await rebuildAbandonedEmails(getPrisma(), new Date());

    printResult(result);

    if (result.failed.length > 0) process.exitCode = 1;
  } finally {
    await getPrisma().$disconnect();
  }
}

function printResult(result: AbandonedRebuildResult): void {
  console.log(`Correos rehechos y en cola: ${describe(result.rebuilt)}.`);
  console.log(`Omitidos (no se pueden rehacer): ${describe(result.skipped)}.`);
  console.log(`Sin su registro de origen (siguen abandonados): ${describe(result.sourceGone)}.`);

  for (const failure of result.failed) {
    console.error(`Falló ${failure.kind} ${failure.emailId}: ${failure.message}`);
  }

  console.log("El trabajador de correo los enviará poco a poco; no se envió ninguno desde aquí.");
}

function describe(counts: KindCounts): string {
  const entries = Object.entries(counts);

  if (entries.length === 0) return "ninguno";

  return entries.map(([kind, count]) => `${kind}: ${count}`).join(", ");
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
