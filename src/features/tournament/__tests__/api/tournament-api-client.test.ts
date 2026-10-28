/**
 * @jest-environment node
 */
import { fetchTournament, TOURNAMENT_API_PATH } from "@features/tournament/api/tournament-api-client";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("fetchTournament", () => {
  it("asks the Route Handler without using the browser cache and returns the snapshot", async () => {
    const tournament = createTestTournament();
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ tournament, serverNow: 123 }));

    expect(await fetchTournament()).toEqual({ tournament, serverNow: 123 });
    expect(fetchSpy).toHaveBeenCalledWith(TOURNAMENT_API_PATH, { cache: "no-store" });
  });

  it("returns null while the bracket is not generated", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ tournament: null, serverNow: 5 }));

    expect(await fetchTournament()).toEqual({ tournament: null, serverNow: 5 });
  });

  it("fails when the server does not answer 200", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 401 }));

    await expect(fetchTournament()).rejects.toThrow("401");
  });

  it("fails when the answer is not a tournament snapshot", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ tournament: { phase: "running" } }));

    await expect(fetchTournament()).rejects.toThrow();
  });
});
