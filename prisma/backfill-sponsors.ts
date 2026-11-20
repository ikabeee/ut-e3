import { loadEnvConfig } from "@next/env";
import { backfillSponsors } from "@features/sponsors/lib/server/sponsors-backfill";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npx tsx --conditions=react-server prisma/backfill-sponsors.ts`, on a database that already has its sponsors.
// Safe to run again: it adds the sponsors that are missing and fills only the empty fields of the existing ones (see
// backfillSponsors).
loadEnvConfig(process.cwd());

backfillAndReport().catch(reportFailure);

async function backfillAndReport(): Promise<void> {
  try {
    const { added, filled } = await backfillSponsors(getPrisma());

    console.log(`Patrocinadores agregados: ${added.length} (${added.join(", ") || "ninguno"})`);
    console.log(`Patrocinadores completados: ${filled.length} (${filled.join("; ") || "ninguno"})`);
    console.log("Reinicia la app para que la portada y /sponsors muestren el cambio (están en caché).");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
