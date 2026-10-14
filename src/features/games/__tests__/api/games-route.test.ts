/**
 * @jest-environment node
 */
import { parseGamesResponse } from "@features/games/api/games-contract";
import { createGamesRoute } from "@features/games/api/games-route";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

describe("GET /api/games", () => {
  it("responds with the games in the HTTP contract", async () => {
    const GET = createGamesRoute(async () => GAME_FIXTURES.slice(0, 2));
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(parseGamesResponse(await response.json())).toEqual(GAME_FIXTURES.slice(0, 2));
  });
});
