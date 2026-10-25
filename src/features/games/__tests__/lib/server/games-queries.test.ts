/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { GAMES_CACHE_TAG, getGames } from "@features/games/lib/server/games-queries";
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
import type { StandLocation } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

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
  // INITIAL_GAMES is written in stand order (ZA-S1 to ZT-S6), so it is also the expected order.
  it("returns the seeded games ordered by stand, with UUID ids", async () => {
    await seedGames(getPrisma());

    expect(await getGames()).toEqual(INITIAL_GAMES.map(withUuids));
  });

  it("puts Ceniza Protocol at ZA-S1 with its action genre and one cover at position 1", async () => {
    await seedGames(getPrisma());

    const [first] = await getGames();

    expect(first).toEqual({
      id: expect.stringMatching(UUID),
      slug: "ceniza-protocol",
      name: "Ceniza Protocol",
      synopsis: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
      genre: { id: expect.stringMatching(UUID), name: "Acción", slug: "accion" },
      stand: { zone: "A", number: 1 },
      images: [{ path: "/games/ceniza-protocol.jpg", alt: "Portada de Ceniza Protocol", position: 1, isCover: true }],
      itchUrl: null,
    });
  });

  it("returns an empty list when there are no games", async () => {
    expect(await getGames()).toEqual([]);
  });

  it("orders the games by stand even when they are stored out of order", async () => {
    const genre = await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } });

    await createGameAt(genre.id, { zone: "T", number: 6 }, "sexto");
    await createGameAt(genre.id, { zone: "A", number: 2 }, "segundo");
    await createGameAt(genre.id, { zone: "A", number: 1 }, "primero");

    expect((await getGames()).map((game) => game.slug)).toEqual(["primero", "segundo", "sexto"]);
  });

  it("caches the catalog for hours under the games tag", async () => {
    await getGames();

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

async function createGameAt(genreId: string, location: StandLocation, slug: string) {
  const stand = await getPrisma().stand.create({ data: { ...location, studio: 4, groupCode: "103" } });

  await getPrisma().game.create({
    data: { slug, name: slug, synopsis: "Juego de prueba.", genreId, standId: stand.id },
  });
}
