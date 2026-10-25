/**
 * @jest-environment node
 */
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
import { formatStandCode } from "@features/games/lib/stand-code";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const EVENT_STANDS = [
  "ZA-S1",
  "ZA-S2",
  "ZA-S3",
  "ZB-S1",
  "ZB-S2",
  "ZB-S3",
  "ZC-S1",
  "ZC-S2",
  "ZC-S3",
  "ZD-S1",
  "ZD-S2",
  "ZD-S3",
  "ZT-S1",
  "ZT-S2",
  "ZT-S3",
  "ZT-S4",
  "ZT-S5",
  "ZT-S6",
];

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("INITIAL_GAMES", () => {
  it("puts one sample game in each of the 18 stands of blocks A to D and T", () => {
    const stands = INITIAL_GAMES.map((game) => formatStandCode(game.stand));

    expect(stands.toSorted()).toEqual(EVENT_STANDS.toSorted());
  });
});

describe("seedGames", () => {
  beforeEach(async () => {
    const prisma = getPrisma();

    await prisma.gameImage.deleteMany();
    await prisma.game.deleteMany();
    await prisma.stand.deleteMany();
    await prisma.genre.deleteMany();
  });

  it("writes one stand per game location, 18 in all", async () => {
    await seedGames(getPrisma());

    const stands = await getPrisma().stand.findMany();

    expect(stands.map(formatStandCode).toSorted()).toEqual(EVENT_STANDS.toSorted());
  });

  it("writes each genre the games use once", async () => {
    await seedGames(getPrisma());

    const genres = await getPrisma().genre.findMany();

    expect(genres.map((genre) => genre.slug).toSorted()).toEqual(
      [...new Set(INITIAL_GAMES.map((game) => game.genre.slug))].toSorted(),
    );
  });

  it("writes every game with one cover image at position 1", async () => {
    await seedGames(getPrisma());

    const games = await getPrisma().game.findMany({ include: { images: true } });

    expect(games.map((game) => game.slug).toSorted()).toEqual(INITIAL_GAMES.map((game) => game.slug).toSorted());
    games.forEach((game) => expect(game.images).toEqual([expect.objectContaining({ position: 1, isCover: true })]));
  });

  it("leaves the same rows when it runs twice", async () => {
    await seedGames(getPrisma());
    const firstRun = await readCatalog();

    await seedGames(getPrisma());

    expect(await readCatalog()).toEqual(firstRun);
  });

  it("keeps a game renamed after the first run and adds no duplicate", async () => {
    await seedGames(getPrisma());
    await getPrisma().game.update({ where: { slug: "ceniza-protocol" }, data: { name: "Ceniza Protocol DX" } });

    await seedGames(getPrisma());

    expect(await getPrisma().game.count()).toBe(INITIAL_GAMES.length);
    expect(await getPrisma().game.findUnique({ where: { slug: "ceniza-protocol" } })).toMatchObject({
      name: "Ceniza Protocol DX",
    });
  });

  it("leaves the catalog as it is once it has games, even after a slug or a cover changes", async () => {
    await seedGames(getPrisma());

    const game = await getPrisma().game.update({
      where: { slug: "ceniza-protocol" },
      data: { slug: "ceniza-protocol-final" },
    });

    await getPrisma().gameImage.updateMany({ where: { gameId: game.id }, data: { position: 2 } });

    const editedCatalog = await readCatalog();

    await seedGames(getPrisma());

    expect(await readCatalog()).toEqual(editedCatalog);
  });

  it("does not bring back a game deleted after the first run", async () => {
    await seedGames(getPrisma());

    const game = await getPrisma().game.findUniqueOrThrow({ where: { slug: "ceniza-protocol" } });

    await getPrisma().gameImage.deleteMany({ where: { gameId: game.id } });
    await getPrisma().game.delete({ where: { id: game.id } });

    await seedGames(getPrisma());

    expect(await getPrisma().game.count()).toBe(INITIAL_GAMES.length - 1);
    expect(await getPrisma().game.findUnique({ where: { slug: "ceniza-protocol" } })).toBeNull();
  });
});

async function readCatalog() {
  const prisma = getPrisma();

  return {
    genres: await prisma.genre.findMany({ orderBy: { id: "asc" } }),
    stands: await prisma.stand.findMany({ orderBy: { id: "asc" } }),
    games: await prisma.game.findMany({ orderBy: { id: "asc" } }),
    images: await prisma.gameImage.findMany({ orderBy: { id: "asc" } }),
  };
}
