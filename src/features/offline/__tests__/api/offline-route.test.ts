/**
 * @jest-environment node
 */
import { GET } from "@features/offline/api/offline-route";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

jest.mock("@features/games/lib/server/games-queries", () => ({
  listGames: async () => GAME_FIXTURES.slice(0, 1),
}));

describe("GET /sw.js", () => {
  it("responds with the service worker script", async () => {
    const response = await GET();
    const script = await response.text();

    expect(response.headers.get("content-type")).toBe("application/javascript; charset=utf-8");
    expect(script).toContain(`/games/${GAME_FIXTURES[0].slug}`);
  });
});
