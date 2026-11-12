import { loadEnvConfig } from "@next/env";
import { formatDemoTable, seedDemo } from "@features/admin/lib/server/demo-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed:demo`, after `npm run db:seed`. Development and demos only: every account gets the same
// password (DEMO_PASSWORD) and the hours of the event stay as they are. `--open-raffle` is the only way to move one.
loadEnvConfig(process.cwd());

seedAndReport().catch(reportSeedFailure);

async function seedAndReport(): Promise<void> {
  try {
    const openRaffle = process.argv.includes("--open-raffle");
    const result = await seedDemo(process.env, new Date(), { openRaffle });

    console.log(formatDemoTable(result));
    console.log("");
    console.log(describeHours(result.raffleOpened, result.bracket));
    console.log("La cuenta del sysadmin no está en la tabla: usa SYSADMIN_EMAIL y SYSADMIN_PASSWORD de db:seed.");
  } finally {
    await getPrisma().$disconnect();
  }
}

function describeHours(raffleOpened: boolean, bracket: string): string {
  const raffle = raffleOpened
    ? "La rifa quedó abierta ahora (--open-raffle)."
    : "Los horarios del evento no se movieron (usa --open-raffle para abrir la rifa ahora).";

  return bracket === "notYet" ? `${raffle} El bracket de KOF no se generó: su hora todavía no llega.` : raffle;
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
