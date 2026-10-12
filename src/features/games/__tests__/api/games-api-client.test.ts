import { fetchGames, GAMES_API_PATH } from "@features/games/api/games-api-client";
import { toGameDto } from "@features/games/api/games-contract";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: async () => response.body,
  });
  globalThis.fetch = fetchMock;
  return fetchMock;
}

describe("fetchGames", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads the games from the route handler", async () => {
    const fetchMock = mockFetch({ ok: true, body: GAME_FIXTURES.slice(0, 3).map(toGameDto) });

    await expect(fetchGames()).resolves.toEqual(GAME_FIXTURES.slice(0, 3));
    expect(fetchMock).toHaveBeenCalledWith(GAMES_API_PATH);
  });

  it("fails with the HTTP status when the request fails", async () => {
    mockFetch({ ok: false, status: 503 });

    await expect(fetchGames()).rejects.toThrow("No se pudieron cargar los juegos (503).");
  });

  it("fails when the response does not match the contract", async () => {
    mockFetch({ ok: true, body: [{ slug: "ruta-9" }] });

    await expect(fetchGames()).rejects.toThrow("[0].name");
  });
});
