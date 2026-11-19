import { loadEnvConfig } from "@next/env";
import { backfillLegacyEmailKinds } from "@features/admin/lib/server/legacy-email-kinds";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npx tsx --conditions=react-server prisma/backfill-email-kinds.ts`, on a database whose outbox still has
// emails queued before the column `kind` existed (S9 of odd/tasks/staff-dual-roles.md). Safe to run again: it only
// writes the unsent rows whose kind is empty and that it can identify, and leaves the others as they are.
loadEnvConfig(process.cwd());

backfillAndReport().catch(reportFailure);

async function backfillAndReport(): Promise<void> {
  try {
    const { updated, untouched } = await backfillLegacyEmailKinds(getPrisma());

    console.log(`Correos con tipo asignado: ${updated}. Sin identificar (no se tocaron): ${untouched}.`);
    console.log('Ahora el sysadmin puede usar "Rehacer" en /admin/emails.');
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
