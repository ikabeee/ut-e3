/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { GAMES_CACHE_TAG, getGameBySlug, getGames } from "@features/games/lib/server/games-queries";
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
import type { StandLocation } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// The seed leaves Make 'em Fall, One Mind and Sombra del Mictlán without images and Vaporlock with only the cover.
const UNREADY_SLUGS = ["make-em-fall", "one-mind", "sombra-del-mictlan", "vaporlock"];

const READY_GAMES = INITIAL_GAMES.filter((game) => !UNREADY_SLUGS.includes(game.slug));

const VERTICAL = { path: "/games/x.jpg", alt: "Portada", position: 1, isCover: true };

const HORIZONTAL = { path: "/games/x-portada.jpg", alt: "Portada horizontal", position: 2, isCover: false };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// cacheLife and cacheTag only run inside Next; the spies replace them on the module object the query reads.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const cacheLife = jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

const cacheTag = jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  const prisma = getPrisma();

  await prisma.gameImage.deleteMany();
  await prisma.game.deleteMany();
  await prisma.stand.deleteMany();
  await prisma.genre.deleteMany();
});

describe("getGames", () => {
  // INITIAL_GAMES is written in stand order (ZA-S1 to ZT-S2), so it is also the expected order.
  it("returns the seeded games with their full artwork ordered by stand, with UUID ids", async () => {
    await seedGames(getPrisma());

    expect(await getGames()).toEqual(READY_GAMES.map(withUuids));
  });

  it("hides the games without their vertical cover and their horizontal image (S2)", async () => {
    await seedGames(getPrisma());

    const slugs = (await getGames()).map((game) => game.slug);

    for (const slug of UNREADY_SLUGS) expect(slugs).not.toContain(slug);

    expect(slugs).toHaveLength(INITIAL_GAMES.length - UNREADY_SLUGS.length);
  });

  it("hides a game with only its vertical cover or only a horizontal image, and shows it once it has both", async () => {
    const genre = await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } });

    await createGameAt({ genreId: genre.id, location: { zone: "A", number: 1 }, slug: "sin-arte", images: [] });
    await createGameAt({
      genreId: genre.id,
      location: { zone: "A", number: 2 },
      slug: "solo-vertical",
      images: [VERTICAL],
    });
    await createGameAt({
      genreId: genre.id,
      location: { zone: "A", number: 3 },
      slug: "solo-horizontal",
      images: [HORIZONTAL],
    });
    await createGameAt({
      genreId: genre.id,
      location: { zone: "A", number: 4 },
      slug: "completo",
      images: [VERTICAL, HORIZONTAL],
    });

    expect((await getGames()).map((game) => game.slug)).toEqual(["completo"]);

    await getPrisma().gameImage.create({ data: { ...HORIZONTAL, game: { connect: { slug: "solo-vertical" } } } });

    expect((await getGames()).map((game) => game.slug)).toEqual(["solo-vertical", "completo"]);
  });

  it("puts Abby's Tower at ZB-S1 with its portrait cover first and its landscape artwork second", async () => {
    await seedGames(getPrisma());

    const game = (await getGames()).find((candidate) => candidate.slug === "abby-s-tower");

    expect(game).toEqual({
      id: expect.stringMatching(UUID),
      slug: "abby-s-tower",
      name: "Abby's Tower",
      synopsis: "",
      genre: { id: expect.stringMatching(UUID), name: "Acción", slug: "accion" },
      stand: { zone: "B", number: 1 },
      images: [
        { path: "/games/abby-s-tower.jpg", alt: "Portada de Abby's Tower", position: 1, isCover: true },
        {
          path: "/games/abby-s-tower-portada.jpg",
          alt: "Portada horizontal de Abby's Tower",
          position: 2,
          isCover: false,
        },
      ],
    });
  });

  it("returns an empty list when there are no games", async () => {
    expect(await getGames()).toEqual([]);
  });

  it("orders the games by stand even when they are stored out of order", async () => {
    const genre = await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } });

    await createGameAt({ genreId: genre.id, location: { zone: "T", number: 6 }, slug: "sexto" });
    await createGameAt({ genreId: genre.id, location: { zone: "A", number: 2 }, slug: "segundo" });
    await createGameAt({ genreId: genre.id, location: { zone: "A", number: 1 }, slug: "primero" });

    expect((await getGames()).map((game) => game.slug)).toEqual(["primero", "segundo", "sexto"]);
  });

  it("caches the catalog for hours under the games tag", async () => {
    await getGames();

    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith(GAMES_CACHE_TAG);
  });
});

describe("getGameBySlug", () => {
  it("returns the seeded game with its genre, stand and images", async () => {
    await seedGames(getPrisma());

    const expected = INITIAL_GAMES.find((game) => game.slug === "abby-s-tower");

    expect(await getGameBySlug("abby-s-tower")).toEqual(expected && withUuids(expected));
  });

  it.each(UNREADY_SLUGS)("returns null for %s, which lacks its artwork (S3)", async (slug) => {
    await seedGames(getPrisma());

    expect(await getGameBySlug(slug)).toBeNull();
  });

  it("returns null for a slug no game has", async () => {
    await seedGames(getPrisma());

    expect(await getGameBySlug("no-existe")).toBeNull();
  });

  it("caches the game for hours under the games tag", async () => {
    await getGameBySlug("abby-s-tower");

    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith(GAMES_CACHE_TAG);
  });
});

function withUuids(game: Game) {
  return {
    ...game,
    id: expect.stringMatching(UUID),
    genre: { ...game.genre, id: expect.stringMatching(UUID) },
  };
}

interface TestGame {
  genreId: string;
  location: StandLocation;
  slug: string;
  images?: { path: string; alt: string; position: number; isCover: boolean }[];
}

async function createGameAt({ genreId, location, slug, images = [VERTICAL, HORIZONTAL] }: TestGame) {
  const stand = await getPrisma().stand.create({ data: { ...location, studio: 4, groupCode: "103" } });

  await getPrisma().game.create({
    data: { slug, name: slug, synopsis: "Juego de prueba.", genreId, standId: stand.id, images: { create: images } },
  });
}
