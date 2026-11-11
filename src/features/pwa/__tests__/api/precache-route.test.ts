/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
import { GET } from "@features/pwa/api/precache-route";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// cacheLife and cacheTag only run inside Next, and connection() only inside a request: spies replace them.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const nextServer = jest.requireActual<typeof NextServer>("next/server");

jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const connection = jest.spyOn(nextServer, "connection").mockResolvedValue(undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await seedGames(getPrisma());
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("GET /api/pwa/precache (RNF-14)", () => {
  it("lists the public pages and one page for each game of the catalog", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.paths.slice(0, 5)).toEqual(["/", "/games", "/sponsors", "/privacy", "/offline"]);
    expect(body.paths).toHaveLength(5 + INITIAL_GAMES.length);
    expect(body.paths).toContain(`/games/${INITIAL_GAMES[0].slug}`);
  });

  it("answers at request time and is never cached, so a game that a stand registers is included", async () => {
    connection.mockClear();

    const response = await GET();

    expect(connection).toHaveBeenCalledTimes(1);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("lists only public paths: no staff area, no passport, no API", async () => {
    const { paths } = await (await GET()).json();

    expect(paths.filter((path: string) => /^\/(admin|stand|support|tournament|passport|api|login)/.test(path))).toEqual(
      [],
    );
  });
});
