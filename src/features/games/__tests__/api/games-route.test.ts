/**
 * @jest-environment node
 */
import { GET } from "@features/games/api/games-route";
import { parseGamesResponse } from "@features/games/api/games-contract";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

jest.mock("@features/games/lib/server/games-queries", () => ({
  listGames: async () => MOCK_GAMES.slice(0, 2),
}));

describe("GET /api/games", () => {
  it("responds with the games in the HTTP contract", async () => {
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(parseGamesResponse(await response.json())).toEqual(MOCK_GAMES.slice(0, 2));
  });
});
