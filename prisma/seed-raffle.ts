import { loadEnvConfig } from "@next/env";
import { RAFFLE_DEV_ACCOUNTS, seedRaffleDev } from "@features/raffle/lib/server/raffle-dev-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed:raffle`, after `npm run db:seed`. Development only: the accounts use an example password,
// the tickets have no visits behind them and the start of the raffle moves to now.
loadEnvConfig(process.cwd());

seedAndReport().catch(reportSeedFailure);

async function seedAndReport(): Promise<void> {
  try {
    const result = await seedRaffleDev(process.env, new Date());

    console.log(`Cuentas nuevas: ${result.createdAccounts.join(", ") || "ninguna (ya existían)"}`);
    console.log(`Visitantes nuevos: ${result.createdVisitors}. Boletos nuevos: ${result.createdTickets}.`);
    console.log(`Panel de la rifa (/admin/raffle): ${RAFFLE_DEV_ACCOUNTS.map((account) => account.email).join(", ")}`);
    console.log("Contraseña: RAFFLE_DEV_PASSWORD, o el valor de ejemplo de RAFFLE_DEV_DEFAULT_PASSWORD en el seed.");
    console.log("Tómbola en vivo: /raffle/live. Ganadores: /raffle.");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
