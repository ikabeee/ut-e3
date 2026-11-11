/**
 * @jest-environment node
 */
import {
  fetchAdminSnapshot,
  fetchLiveSnapshot,
  RAFFLE_ADMIN_API_PATH,
  RAFFLE_LIVE_API_PATH,
} from "@features/raffle/api/raffle-api-client";
import { createAdminSnapshot, createLiveSnapshot } from "@features/raffle/__tests__/components/raffle-test-snapshots";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("raffle API client", () => {
  it("reads the public raffle and the panel from their endpoints", async () => {
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(createLiveSnapshot()))
      .mockResolvedValueOnce(Response.json(createAdminSnapshot()));

    expect(await fetchLiveSnapshot()).toEqual(createLiveSnapshot());
    expect(await fetchAdminSnapshot()).toEqual(createAdminSnapshot());
    expect(fetchSpy.mock.calls.map(([path]) => path)).toEqual([RAFFLE_LIVE_API_PATH, RAFFLE_ADMIN_API_PATH]);
  });

  it("refuses an answer that is not a raffle, such as the 401 body of the panel", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(createLiveSnapshot()));

    await expect(fetchAdminSnapshot()).rejects.toThrow("no es válida");
  });
});
