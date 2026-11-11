import { seedSysadmin } from "@features/accounts/lib/server/sysadmin-seed";
import { seedEventSettings } from "@features/event-settings/lib/server/event-settings-seed";
import { seedGames } from "@features/games/lib/server/games-seed";
import { seedScheduleItems } from "@features/schedule/lib/server/schedule-seed";
import { seedSponsors } from "@features/sponsors/lib/server/sponsors-seed";
import { getPrisma } from "@shared/lib/server/prisma";

// Runs with `npm run db:seed`; each feature owns its initial content, this file only composes them.
seedDatabase().catch(reportSeedFailure);

async function seedDatabase(): Promise<void> {
  const prisma = getPrisma();

  try {
    await seedEventSettings(prisma);
    await seedScheduleItems(prisma);
    await seedGames(prisma);
    await seedSponsors(prisma);
    await seedSysadmin(prisma, process.env);
  } finally {
    await prisma.$disconnect();
  }
}

function reportSeedFailure(error: Error): void {
  console.error(error);
  process.exitCode = 1;
}
