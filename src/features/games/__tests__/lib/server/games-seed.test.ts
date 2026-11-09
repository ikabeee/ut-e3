/**
 * @jest-environment node
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
import { formatStandCode } from "@features/games/lib/stand-code";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// Provisional slots, in the order of the games: the floor plan of the landing does not show them.
const GAME_NAMES = [
  "Abby's Tower",
  "After Light",
  "Astrolabio",
  "Carencia",
  "Dark Mutant",
  "EchoScrap",
  "Identity Dissolution",
  "Laboratorio 4",
  "Reencarnación Express",
  "Saatan Paal",
  "True Hero",
  "Turno Rosso",
  "Unknown Game",
  "Vaporlock",
];

const GAME_STANDS = [
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
];

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("INITIAL_GAMES", () => {
  it("lists the 14 games of the showcase in alphabetical order", () => {
    expect(INITIAL_GAMES.map((game) => game.name)).toEqual(GAME_NAMES);
  });

  it("gives each game one of the first 14 provisional stands, in order", () => {
    expect(INITIAL_GAMES.map((game) => formatStandCode(game.stand))).toEqual(GAME_STANDS);
  });

  it("announces no genre and no synopsis, because the sources do not give them", () => {
    for (const game of INITIAL_GAMES) {
      expect(game.genre).toEqual({ id: "por-anunciar", name: "Por anunciar", slug: "por-anunciar" });
      expect(game.synopsis).toBe("");
    }
  });

  it("uses the portrait cover as the main image, and a landscape one second except for Vaporlock", () => {
    for (const game of INITIAL_GAMES) {
      const expectedPaths =
        game.slug === "vaporlock"
          ? [`/games/${game.slug}.jpg`]
          : [`/games/${game.slug}.jpg`, `/games/${game.slug}-portada.jpg`];

      expect(game.images.map((image) => image.path)).toEqual(expectedPaths);
      expect(game.images[0]).toMatchObject({ position: 1, isCover: true, alt: `Portada de ${game.name}` });
    }
  });

  it("only points to image files that exist in public/", () => {
    for (const image of INITIAL_GAMES.flatMap((game) => game.images)) {
      expect(existsSync(join(process.cwd(), "public", image.path))).toBe(true);
    }
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

  it("writes one stand per game location, 14 in all", async () => {
    await seedGames(getPrisma());

    const stands = await getPrisma().stand.findMany();

    expect(stands.map(formatStandCode).toSorted()).toEqual(GAME_STANDS.toSorted());
  });

  it("writes the Por anunciar genre once for all the games", async () => {
    await seedGames(getPrisma());

    const genres = await getPrisma().genre.findMany();

    expect(genres).toEqual([expect.objectContaining({ name: "Por anunciar", slug: "por-anunciar" })]);
  });

  it("writes every game with an empty synopsis and its cover at position 1", async () => {
    await seedGames(getPrisma());

    const games = await getPrisma().game.findMany({ include: { images: { orderBy: { position: "asc" } } } });

    expect(games.map((game) => game.slug).toSorted()).toEqual(INITIAL_GAMES.map((game) => game.slug).toSorted());
    games.forEach((game) => {
      expect(game.synopsis).toBe("");
      expect(game.images[0]).toMatchObject({ position: 1, isCover: true });
    });
  });

  it("writes the landscape image of each game at position 2, except Vaporlock which has none", async () => {
    await seedGames(getPrisma());

    const games = await getPrisma().game.findMany({ include: { images: { orderBy: { position: "asc" } } } });

    const imagePositions = Object.fromEntries(
      games.map((game) => [game.slug, game.images.map((image) => `${image.position}:${image.isCover}`)]),
    );

    expect(imagePositions).toEqual(
      Object.fromEntries(
        INITIAL_GAMES.map((game) => [game.slug, game.slug === "vaporlock" ? ["1:true"] : ["1:true", "2:false"]]),
      ),
    );
  });

  it("leaves the same rows when it runs twice", async () => {
    await seedGames(getPrisma());
    const firstRun = await readCatalog();

    await seedGames(getPrisma());

    expect(await readCatalog()).toEqual(firstRun);
  });

  it("keeps a game renamed after the first run and adds no duplicate", async () => {
    await seedGames(getPrisma());
    await getPrisma().game.update({ where: { slug: "abby-s-tower" }, data: { name: "Abby's Tower DX" } });

    await seedGames(getPrisma());

    expect(await getPrisma().game.count()).toBe(INITIAL_GAMES.length);
    expect(await getPrisma().game.findUnique({ where: { slug: "abby-s-tower" } })).toMatchObject({
      name: "Abby's Tower DX",
    });
  });

  it("leaves the catalog as it is once it has games, even after a slug or a cover changes", async () => {
    await seedGames(getPrisma());

    const game = await getPrisma().game.update({
      where: { slug: "abby-s-tower" },
      data: { slug: "abby-s-tower-final" },
    });

    await getPrisma().gameImage.updateMany({ where: { gameId: game.id, isCover: true }, data: { position: 3 } });

    const editedCatalog = await readCatalog();

    await seedGames(getPrisma());

    expect(await readCatalog()).toEqual(editedCatalog);
  });

  it("does not bring back a game deleted after the first run", async () => {
    await seedGames(getPrisma());

    const game = await getPrisma().game.findUniqueOrThrow({ where: { slug: "abby-s-tower" } });

    await getPrisma().gameImage.deleteMany({ where: { gameId: game.id } });
    await getPrisma().game.delete({ where: { id: game.id } });

    await seedGames(getPrisma());

    expect(await getPrisma().game.count()).toBe(INITIAL_GAMES.length - 1);
    expect(await getPrisma().game.findUnique({ where: { slug: "abby-s-tower" } })).toBeNull();
  });

  it("writes no game when a run fails partway, so the next run fills the whole catalog", async () => {
    // The event admits 18 stands: with 5 already taken, the 14th game finds no room after 13 games were written.
    const takenStands = await getPrisma().stand.createManyAndReturn({
      data: [4, 5, 6, 7, 8].map((number) => ({ zone: "D", number, studio: 0, groupCode: "000" })),
    });

    await expect(seedGames(getPrisma())).rejects.toThrow();
    expect(await getPrisma().game.count()).toBe(0);

    await getPrisma().stand.deleteMany({ where: { id: { in: takenStands.map((stand) => stand.id) } } });
    await seedGames(getPrisma());

    expect(await getPrisma().game.count()).toBe(INITIAL_GAMES.length);
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
