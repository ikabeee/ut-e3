import { loadEnvConfig } from "@next/env";
import {
  STAND_DEV_ADMIN_EMAIL,
  STAND_DEV_NEARLY_THERE_PIN,
  getStandDevStaffEmail,
  seedStandsDev,
} from "@features/stands/lib/server/stands-dev-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed:stands`, after `npm run db:seed`. Development only: the accounts use an example password.
loadEnvConfig(process.cwd());

seedAndReport().catch(reportSeedFailure);

async function seedAndReport(): Promise<void> {
  try {
    const result = await seedStandsDev(process.env, new Date());

    console.log("El registro de pasaportes quedó abierto (/register).");
    console.log(`Cuentas nuevas: ${result.createdAccounts.length}`);
    console.log(`Visitantes de prueba nuevos: ${result.createdVisitors} (PIN 10001 a 10024)`);
    console.log(`Staff del stand ZA-S1: ${getStandDevStaffEmail("A", 1)}; administrador: ${STAND_DEV_ADMIN_EMAIL}`);
    console.log(
      `El PIN ${STAND_DEV_NEARLY_THERE_PIN} lleva 8 visitas: su visita al stand ZA-S1 es la novena y da boleto.`,
    );
    console.log("Contraseña: STAND_DEV_PASSWORD, o el valor de ejemplo de STAND_DEV_DEFAULT_PASSWORD en el seed.");
  } finally {
    await getPrisma().$disconnect();
  }
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
