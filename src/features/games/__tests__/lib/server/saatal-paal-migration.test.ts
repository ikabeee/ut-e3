/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedGames } from "@features/games/lib/server/games-seed";
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const MIGRATION = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "20261119120000_rename_saatal_paal",
  "migration.sql",
);

const SLUG = "saatan-paal";

const database = createTestDatabase();

const prisma = createTestClient(database);

beforeAll(async () => {
  await seedGames(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

describe("migration rename_saatal_paal (S15)", () => {
  it("renames the game and its image alt texts in a database seeded before the rename, and can run again", async () => {
    await writeOldName("Saatan Paal");

    applyMigration();
    applyMigration();

    const game = await prisma.game.findUniqueOrThrow({ where: { slug: SLUG }, include: { images: true } });

    expect(game.name).toBe("Saatal Paal");
    expect(game.images.map((image) => image.alt).toSorted()).toEqual([
      "Portada de Saatal Paal",
      "Portada horizontal de Saatal Paal",
    ]);
  });

  it("keeps a name the sysadmin already changed, and the other games", async () => {
    await writeOldName("Saatan Paal (demo)");

    applyMigration();

    expect((await prisma.game.findUniqueOrThrow({ where: { slug: SLUG } })).name).toBe("Saatan Paal (demo)");
    expect((await prisma.game.findUniqueOrThrow({ where: { slug: "turno-rosso" } })).name).toBe("Turno Rosso");
  });
});

async function writeOldName(name: string) {
  const game = await prisma.game.update({ where: { slug: SLUG }, data: { name } });

  await prisma.gameImage.updateMany({
    where: { gameId: game.id, position: 1 },
    data: { alt: "Portada de Saatan Paal" },
  });
  await prisma.gameImage.updateMany({
    where: { gameId: game.id, position: 2 },
    data: { alt: "Portada horizontal de Saatan Paal" },
  });
}

function applyMigration() {
  const connection = new DatabaseSync(database.url.replace(/^file:/, ""));

  try {
    connection.exec(readFileSync(MIGRATION, "utf8"));
  } finally {
    connection.close();
  }
}
