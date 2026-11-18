/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { GET } from "@features/games/api/games-route";
import { getGames } from "@features/games/lib/server/games-queries";
import { seedGames } from "@features/games/lib/server/games-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// cacheLife and cacheTag only run inside Next: spies replace them.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await seedGames(getPrisma());
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("GET /api/games (S21)", () => {
  it("lists the public games with only the slug, the name and the genre the navbar search needs", async () => {
    const body = await (await GET()).json();
    const games = await getGames();

    expect(body).toEqual({
      games: games.map((game) => ({ slug: game.slug, name: game.name, genreName: game.genre.name })),
    });
    expect(body.games).toContainEqual({ slug: "saatan-paal", name: "Saatal Paal", genreName: "Sigilo" });
  });

  it("leaves out the games that are not public yet", async () => {
    const body = await (await GET()).json();

    expect(body.games.map((game: { slug: string }) => game.slug)).not.toContain("one-mind");
  });
});
