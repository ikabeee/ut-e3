/**
 * @jest-environment node
 */
import { backfillGameGenres } from "@features/games/lib/server/game-genre-backfill";
import { seedGames } from "@features/games/lib/server/games-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// 18 games, 17 with a confirmed genre: Make 'em Fall has none yet.
const CONFIRMED_GAMES = 17;

beforeEach(async () => {
  await resetToAnOldCatalog();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("backfillGameGenres", () => {
  it("gives each game of the list its confirmed genre, reusing the genres that already exist", async () => {
    const result = await backfillGameGenres(getPrisma());

    expect(result.updated).toHaveLength(CONFIRMED_GAMES - 1);
    expect(result.missing).toEqual([]);
    expect(await readGenres()).toMatchObject({
      "true-hero": "Arcade",
      "abby-s-tower": "Acción",
      carencia: "Terror",
      "dark-mutant": "Survival Horror",
      "saatan-paal": "Sigilo",
      "turno-rosso": "Simulación",
      "after-light": "Roguelike",
      "make-em-fall": "Por anunciar",
    });
  });

  it("reuses 'Plataforma' and 'Rol (RPG)' instead of creating 'Plataformas' and 'RPG'", async () => {
    await backfillGameGenres(getPrisma());

    const genres = await readGenres();
    const names = await getPrisma().genre.findMany({ select: { name: true } });

    expect(genres["unknown-game"]).toBe("Plataforma");
    expect(genres["astrolabio"]).toBe("Plataforma");
    expect(genres["sombra-del-mictlan"]).toBe("Rol (RPG)");
    expect(names.map(({ name }) => name)).not.toContain("Plataformas");
    expect(names.map(({ name }) => name)).not.toContain("RPG");
  });

  it("does not overwrite a genre that the sysadmin changed, and does not touch the game without a confirmed genre", async () => {
    const result = await backfillGameGenres(getPrisma());
    const genres = await readGenres();

    expect(result.keptByHand).toEqual(["true-hero"]);
    expect(genres["true-hero"]).toBe("Arcade");
    expect(genres["make-em-fall"]).toBe("Por anunciar");
  });

  it("is idempotent: a second run changes nothing and audits nothing new", async () => {
    await backfillGameGenres(getPrisma());

    const before = await countAudits();
    const second = await backfillGameGenres(getPrisma());

    expect(second.updated).toEqual([]);
    expect(second.alreadySet).toHaveLength(CONFIRMED_GAMES - 1);
    await expect(countAudits()).resolves.toBe(before);
  });

  it("records each change in the audit log without an actor", async () => {
    await backfillGameGenres(getPrisma());

    const entry = await getPrisma().auditLog.findFirstOrThrow({ where: { action: "game.genre_backfill" } });

    expect(entry).toMatchObject({ actorId: null, entityType: "game" });
  });

  it("reports the games of the list that are not in the database", async () => {
    await getPrisma().gameImage.deleteMany({ where: { game: { slug: "carencia" } } });
    await getPrisma().game.delete({ where: { slug: "carencia" } });

    const result = await backfillGameGenres(getPrisma());

    expect(result.missing).toEqual(["carencia"]);
  });
});

// The catalog of a database seeded before the genres were confirmed: every game says "Por anunciar", the sysadmin
// created "Plataforma" and "Rol (RPG)" by hand, changed True Hero to "Arcade". Make 'em Fall has no confirmed genre, so it is outside the list.
async function resetToAnOldCatalog(): Promise<void> {
  const prisma = getPrisma();

  await prisma.gameImage.deleteMany();
  await prisma.game.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.stand.deleteMany();
  await seedGames(prisma);

  const placeholder = await prisma.genre.findUniqueOrThrow({ where: { slug: "por-anunciar" } });

  await prisma.game.updateMany({ data: { genreId: placeholder.id } });
  await prisma.genre.deleteMany({ where: { slug: { not: "por-anunciar" } } });
  await prisma.genre.create({ data: { name: "Plataforma", slug: "plataforma" } });
  await prisma.genre.create({ data: { name: "Rol (RPG)", slug: "rol-rpg" } });

  const arcade = await prisma.genre.create({ data: { name: "Arcade", slug: "arcade" } });

  await prisma.game.update({ where: { slug: "true-hero" }, data: { genreId: arcade.id } });
}

async function readGenres(): Promise<Record<string, string>> {
  const games = await getPrisma().game.findMany({ include: { genre: true } });

  return Object.fromEntries(games.map((game) => [game.slug, game.genre.name]));
}

// The audit log only accepts inserts, so its entries stay between tests: they are compared before and after a run.
function countAudits(): Promise<number> {
  return getPrisma().auditLog.count({ where: { action: "game.genre_backfill" } });
}
