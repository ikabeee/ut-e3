import { loadEnvConfig } from "@next/env";
import {
  rebuildAbandonedEmails,
  type AbandonedRebuildResult,
  type KindCounts,
  type PlannedRebuild,
} from "@features/admin/lib/server/abandoned-email-rebuild";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npx tsx --conditions=react-server prisma/rebuild-abandoned-emails.ts [--dry-run]`, when the sysadmin cannot
// reach "Rehacer" in /admin/emails (S9 of odd/tasks/staff-dual-roles.md). It only handles STAFF emails (staff_invitation
// and password_reset): it makes them again with new links and leaves them queued for the throttled mail worker, and
// nothing is sent here. Visitor emails (passport, recovery, KOF, raffle) are never read, deleted or queued again.
// `--dry-run` lists what it would do and writes nothing; run it first. Safe to run again: a rebuilt row is no longer
// abandoned. The exit code is 1 when any row failed.
loadEnvConfig(process.cwd());

rebuildAndReport().catch(reportFailure);

async function rebuildAndReport(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const result = await rebuildAbandonedEmails(getPrisma(), new Date(), { dryRun });

    if (dryRun) {
      printPlan(result);
    } else {
      printResult(result);
    }

    if (result.failed.length > 0) process.exitCode = 1;
  } finally {
    await getPrisma().$disconnect();
  }
}

function printPlan(result: AbandonedRebuildResult): void {
  console.log("Prueba (--dry-run): no se escribió nada. Con la corrida real se intentaría rehacer:");

  for (const planned of result.planned) console.log(describePlanned(planned));

  console.log(`Total: ${result.planned.length}.`);
  console.log(`Se omitirían (sin referencia): ${describe(result.skipped)}.`);
  console.log(
    "Una corrida real puede encontrar que la cuenta ya no existe o cambió; entonces el correo sigue abandonado.",
  );
}

function describePlanned(planned: PlannedRebuild): string {
  return `- ${planned.emailId} ${planned.kind} creado ${planned.createdAt.toISOString()}`;
}

function printResult(result: AbandonedRebuildResult): void {
  console.log(`Correos rehechos y en cola: ${describe(result.rebuilt)}.`);
  console.log(`Omitidos (sin referencia): ${describe(result.skipped)}.`);
  console.log(`Sin su cuenta de origen (siguen abandonados): ${describe(result.sourceGone)}.`);

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
