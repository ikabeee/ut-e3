/**
 * @jest-environment node
 */
import { fetchPublicSnapshot, PUBLIC_BRACKET_API_PATH } from "@features/tournament/api/public-bracket-api-client";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("fetchPublicSnapshot", () => {
  it("asks the public endpoint without using the browser cache", async () => {
    const snapshot = { state: "open", bracket: toPublicBracket(createTestTournament()), serverNow: 5 };
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(snapshot));

    expect(await fetchPublicSnapshot()).toEqual(snapshot);
    expect(fetchSpy).toHaveBeenCalledWith(PUBLIC_BRACKET_API_PATH, { cache: "no-store" });
    expect(PUBLIC_BRACKET_API_PATH).toBe("/api/tournament/public");
  });

  it.each(["closed", "pending"])("accepts the %s state, which has no bracket", async (state) => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ state, serverNow: 7 }));

    expect(await fetchPublicSnapshot()).toEqual({ state, serverNow: 7 });
  });

  it("fails when the server does not answer 200", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 503 }));

    await expect(fetchPublicSnapshot()).rejects.toThrow("503");
  });

  it.each([
    ["an unknown state", { state: "secret", serverNow: 1 }],
    ["an open state without a bracket", { state: "open", serverNow: 1 }],
    ["an open state with a bracket that is not one", { state: "open", bracket: { matches: "x" }, serverNow: 1 }],
    ["no clock", { state: "closed" }],
  ])("fails when the answer is %s", async (_case, body) => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(body));

    await expect(fetchPublicSnapshot()).rejects.toThrow();
  });
});
