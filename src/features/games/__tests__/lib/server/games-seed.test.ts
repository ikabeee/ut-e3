/**
 * @jest-environment node
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { INITIAL_GAMES, INITIAL_STANDS, seedGames } from "@features/games/lib/server/games-seed";
import { formatAdminStandCode } from "@features/games/lib/stand-code";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// The 17 games of the showcase with their real stand, studio and group, in stand order. ZC-S3 has no game.
const GAMES = [
  ["ZA-S1-E6-101", "Make 'em Fall"],
  ["ZA-S2-E5-102", "True Hero"],
  ["ZA-S3-E4-103", "Laboratorio 4"],
  ["ZB-S1-E2-103", "Abby's Tower"],
  ["ZB-S2-E4-101", "One Mind"],
  ["ZB-S3-E3-103", "Vaporlock"],
  ["ZC-S1-E6-103", "Unknown Game"],
  ["ZC-S2-E1-101", "Sombra del Mictlán"],
  ["ZD-S1-E2-102", "Turno Rosso"],
  ["ZD-S2-E5-103", "Reencarnación Express"],
  ["ZD-S3-E1-103", "Astrolabio"],
  ["ZT-S1-E6-102", "EchoScrap"],
  ["ZT-S2-E1-102", "After Light"],
  ["ZT-S3-E4-102", "Dark Mutant"],
  ["ZT-S4-E3-102", "Saatan Paal"],
  ["ZT-S5-E3-101", "Carencia"],
  ["ZT-S6-E2-101", "Identity Dissolution"],
] as const;

// They have no artwork yet: the pages show a generic cover with their name.
const GAMES_WITHOUT_COVER = ["make-em-fall", "one-mind", "sombra-del-mictlan"];

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("INITIAL_GAMES", () => {
  it("lists the 17 games of the showcase in stand order", () => {
    expect(INITIAL_GAMES.map((game) => game.name)).toEqual(GAMES.map(([, name]) => name));
  });

  it("gives each game its real stand, studio and group", () => {
    expect(INITIAL_STANDS.map(formatAdminStandCode)).toEqual(GAMES.map(([code]) => code));
  });

  it("leaves ZC-S3 without a game", () => {
    expect(INITIAL_STANDS.map(formatAdminStandCode).some((code) => code.startsWith("ZC-S3"))).toBe(false);
  });

  it("announces no genre and no synopsis, because the sources do not give them", () => {
    for (const game of INITIAL_GAMES) {
      expect(game.genre).toEqual({ id: "por-anunciar", name: "Por anunciar", slug: "por-anunciar" });
      expect(game.synopsis).toBe("");
    }
  });

  it("uses the portrait cover as the main image, and a landscape one second except for Vaporlock", () => {
    for (const game of INITIAL_GAMES.filter((candidate) => !GAMES_WITHOUT_COVER.includes(candidate.slug))) {
      const expectedPaths =
        game.slug === "vaporlock"
          ? [`/games/${game.slug}.jpg`]
          : [`/games/${game.slug}.jpg`, `/games/${game.slug}-portada.jpg`];

      expect(game.images.map((image) => image.path)).toEqual(expectedPaths);
      expect(game.images[0]).toMatchObject({ position: 1, isCover: true, alt: `Portada de ${game.name}` });
    }
  });

  it("gives no images to the games without artwork, so the pages show a generic cover", () => {
    const games = INITIAL_GAMES.filter((game) => GAMES_WITHOUT_COVER.includes(game.slug));

    expect(games.map((game) => game.slug)).toEqual(GAMES_WITHOUT_COVER);
    games.forEach((game) => expect(game.images).toEqual([]));
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

  it("writes one stand per game with its studio and group, 17 in all", async () => {
    await seedGames(getPrisma());

    const stands = await getPrisma().stand.findMany();

    expect(stands.map(formatAdminStandCode).toSorted()).toEqual(GAMES.map(([code]) => code).toSorted());
  });

  it("writes the Por anunciar genre once for all the games", async () => {
    await seedGames(getPrisma());

    const genres = await getPrisma().genre.findMany();

    expect(genres).toEqual([expect.objectContaining({ name: "Por anunciar", slug: "por-anunciar" })]);
  });

  it("writes every game with an empty synopsis and its cover at position 1 when it has one", async () => {
    await seedGames(getPrisma());

    const games = await getPrisma().game.findMany({ include: { images: { orderBy: { position: "asc" } } } });

    expect(games.map((game) => game.slug).toSorted()).toEqual(INITIAL_GAMES.map((game) => game.slug).toSorted());
    games.forEach((game) => {
      expect(game.synopsis).toBe("");

      if (!GAMES_WITHOUT_COVER.includes(game.slug))
        expect(game.images[0]).toMatchObject({ position: 1, isCover: true });
    });
  });

  it("writes the landscape image of each game at position 2, except Vaporlock which has none, and no images for the games without artwork", async () => {
    await seedGames(getPrisma());

    const games = await getPrisma().game.findMany({ include: { images: { orderBy: { position: "asc" } } } });

    const imagePositions = Object.fromEntries(
      games.map((game) => [game.slug, game.images.map((image) => `${image.position}:${image.isCover}`)]),
    );

    expect(imagePositions).toEqual(
      Object.fromEntries(INITIAL_GAMES.map((game) => [game.slug, expectedPositions(game.slug)])),
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
    // The event admits 18 stands: with 2 already taken, the 17th game finds no room after 16 games were written.
    const takenStands = await getPrisma().stand.createManyAndReturn({
      data: [4, 5].map((number) => ({ zone: "D", number, studio: 0, groupCode: "000" })),
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

function expectedPositions(slug: string): string[] {
  if (GAMES_WITHOUT_COVER.includes(slug)) return [];

  return slug === "vaporlock" ? ["1:true"] : ["1:true", "2:false"];
}
