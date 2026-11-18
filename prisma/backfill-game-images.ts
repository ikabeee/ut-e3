import { loadEnvConfig } from "@next/env";
import { backfillGameImages } from "@features/games/lib/server/game-image-backfill";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npx tsx --conditions=react-server prisma/backfill-game-images.ts`, on a database that already has its games.
// Safe to run again: it only adds the images of a position that is empty (see backfillGameImages).
loadEnvConfig(process.cwd());

backfillAndReport().catch(reportFailure);

async function backfillAndReport(): Promise<void> {
  try {
    const added = await backfillGameImages(getPrisma());

    console.log(`Imágenes agregadas: ${added.length} (${added.join(", ") || "ninguna"})`);
    console.log("Reinicia la app para que la portada y el catálogo muestren el cambio (están en caché).");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
