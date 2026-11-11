/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import { GET } from "@features/games/api/itch-route";
import { getGames } from "@features/games/lib/server/games-queries";
import { INITIAL_GAMES, seedGames } from "@features/games/lib/server/games-seed";
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

const ITCH_URL = "https://utg.itch.io/ceniza-protocol";

const SLUG = INITIAL_GAMES[0].slug;

const OPENS_AT = new Date("2026-11-20T21:30:00.000Z");

beforeAll(async () => {
  await seedGames(getPrisma());
  await getPrisma().game.update({ where: { slug: SLUG }, data: { itchUrl: ITCH_URL } });
  await getPrisma().eventSettings.create({ data: settings() });
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("GET /api/games/<slug>/itch (RF-10)", () => {
  it("does not give the URL before the activation time: it only says when it opens", async () => {
    jest.useFakeTimers({ now: new Date(OPENS_AT.getTime() - 1), doNotFake: ["nextTick", "setImmediate"] });

    const response = await call(SLUG);
    const text = await response.text();

    expect(JSON.parse(text)).toEqual({ link: { status: "pending", opensAt: OPENS_AT.toISOString() } });
    expect(text).not.toContain("itch.io/ceniza");
  });

  it("gives the URL from the activation time on, judged by the clock of the server", async () => {
    jest.useFakeTimers({ now: OPENS_AT, doNotFake: ["nextTick", "setImmediate"] });

    expect(await (await call(SLUG)).json()).toEqual({ link: { status: "open", url: ITCH_URL } });
  });

  it("says there is no link for a game that has none", async () => {
    const other = INITIAL_GAMES[1].slug;

    jest.useFakeTimers({ now: new Date(OPENS_AT.getTime() + 1000), doNotFake: ["nextTick", "setImmediate"] });

    expect(await (await call(other)).json()).toEqual({ link: { status: "hidden" } });
  });

  it("answers 404 for a game that does not exist", async () => {
    const response = await call("not-a-game");

    expect(response.status).toBe(404);
  });

  it("is never stored: it answers per request with Cache-Control no-store", async () => {
    connection.mockClear();

    const response = await call(SLUG);

    expect(connection).toHaveBeenCalledTimes(1);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("is not part of any page: the games that pages receive carry no itch.io URL", async () => {
    const games = await getGames();

    expect(JSON.stringify(games)).not.toContain("itch.io");
    expect(games.every((game) => !("itchUrl" in game))).toBe(true);
  });
});

function call(slug: string) {
  return GET(new Request(`http://localhost/api/games/${slug}/itch`), { params: Promise.resolve({ slug }) });
}

function settings() {
  return {
    id: 1,
    eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
    eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
    registrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
    kofRegistrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
    kofCheckInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
    kofCheckInEndsAt: new Date("2026-11-20T17:45:00.000Z"),
    kofOnsiteSignupStartsAt: new Date("2026-11-20T17:00:00.000Z"),
    kofOnsiteSignupEndsAt: new Date("2026-11-20T17:45:00.000Z"),
    kofBracketGeneratesAt: new Date("2026-11-20T17:55:00.000Z"),
    marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
    itchOpensAt: OPENS_AT,
    checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
    raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
    publicBracketEnabled: true,
  };
}
