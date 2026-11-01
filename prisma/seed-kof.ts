import { loadEnvConfig } from "@next/env";
import {
  KOF_DEV_ACCOUNTS,
  KOF_DEV_PLAYER_COUNT,
  seedKofDev,
} from "@features/tournament/lib/server/tournament-dev-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed:kof`, after `npm run db:seed`. Development only: the accounts use an example password.
loadEnvConfig(process.cwd());

seedAndReport().catch(reportSeedFailure);

async function seedAndReport(): Promise<void> {
  try {
    const result = await seedKofDev(process.env, new Date());

    console.log(`Cuentas nuevas: ${result.createdAccounts.join(", ") || "ninguna (ya existían)"}`);
    console.log(
      result.bracket === "created"
        ? `Bracket generado con ${KOF_DEV_PLAYER_COUNT} jugadores de prueba.`
        : "El bracket ya estaba generado; no se tocó.",
    );
    console.log(`Cuentas de KOF: ${KOF_DEV_ACCOUNTS.map((account) => account.email).join(", ")}`);
    console.log("Contraseña: KOF_DEV_PASSWORD, o el valor de ejemplo de KOF_DEV_DEFAULT_PASSWORD en el seed.");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
