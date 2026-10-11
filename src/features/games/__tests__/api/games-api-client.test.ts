import { fetchGames, GAMES_API_PATH } from "@features/games/api/games-api-client";
import { toGameDto } from "@features/games/api/games-contract";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

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
    const fetchMock = mockFetch({ ok: true, body: MOCK_GAMES.slice(0, 3).map(toGameDto) });

    await expect(fetchGames()).resolves.toEqual(MOCK_GAMES.slice(0, 3));
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
