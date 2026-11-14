import { loadEnvConfig } from "@next/env";
import { backfillGameGenres } from "@features/games/lib/server/game-genre-backfill";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:backfill:genres`, on a database that already has its games. Safe to run again: it only fills
// the genre of a game that still says "Por anunciar" (see backfillGameGenres).
loadEnvConfig(process.cwd());

backfillAndReport().catch(reportFailure);

async function backfillAndReport(): Promise<void> {
  try {
    const result = await backfillGameGenres(getPrisma());

    console.log(`Con su género: ${result.updated.length} (${result.updated.join(", ") || "ninguno"})`);
    console.log(`Ya lo tenían: ${result.alreadySet.length}`);
    console.log(`Cambiados a mano, no se tocan: ${result.keptByHand.join(", ") || "ninguno"}`);
    console.log(`No están en esta base: ${result.missing.join(", ") || "ninguno"}`);
    console.log("Reinicia la app para que la portada y el catálogo muestren el cambio (están en caché).");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
