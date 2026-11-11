import { loadEnvConfig } from "@next/env";
import { SUPPORT_DEV_HELP_DESK_EMAIL, seedSupportDev } from "@features/support/lib/server/support-dev-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed:support`, after `npm run db:seed`. Development only: the account uses an example password.
// The visitors to recover come from `npm run db:seed:stands` (Visitante de prueba 10001, gamertag Visitante10001).
loadEnvConfig(process.cwd());

seedAndReport().catch(reportSeedFailure);

async function seedAndReport(): Promise<void> {
  try {
    const created = await seedSupportDev(process.env);

    console.log(`Cuentas nuevas: ${created.length}`);
    console.log(`Mesa de recuperación (/support/recovery): ${SUPPORT_DEV_HELP_DESK_EMAIL}`);
    console.log("Contraseña: SUPPORT_DEV_PASSWORD, o el valor de ejemplo de SUPPORT_DEV_DEFAULT_PASSWORD en el seed.");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
