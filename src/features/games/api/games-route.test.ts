/**
 * @jest-environment node
 */
import { GET } from "@features/games/api/games-route";
import { parseGamesResponse } from "@features/games/api/games-contract";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

jest.mock("@features/games/lib/server/games-queries", () => ({
  listGames: async () => GAME_FIXTURES.slice(0, 2),
}));

describe("GET /api/games", () => {
  it("responds with the games in the HTTP contract", async () => {
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(parseGamesResponse(await response.json())).toEqual(GAME_FIXTURES.slice(0, 2));
  });
});
