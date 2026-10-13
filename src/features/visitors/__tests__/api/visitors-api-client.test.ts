import {
  fetchStandTraffic,
  parseStandTrafficResponse,
  STAND_TRAFFIC_API_PATH,
} from "@features/visitors/api/visitors-api-client";

const report = { windowMinutes: 15, stands: [{ standCode: "A1", recentCheckIns: 3 }] };

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: async () => response.body,
  });

  globalThis.fetch = fetchMock;

  return fetchMock;
}

describe("fetchStandTraffic", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads the traffic report from the route handler", async () => {
    const fetchMock = mockFetch({ ok: true, body: report });

    await expect(fetchStandTraffic()).resolves.toEqual(report);
    expect(fetchMock).toHaveBeenCalledWith(STAND_TRAFFIC_API_PATH);
  });

  it("fails with the HTTP status when the request fails", async () => {
    mockFetch({ ok: false, status: 500 });

    await expect(fetchStandTraffic()).rejects.toThrow("No se pudo cargar la afluencia (500).");
  });
});

describe("parseStandTrafficResponse", () => {
  it("names the first invalid field", () => {
    expect(() => parseStandTrafficResponse([])).toThrow("se esperaba un objeto");
    expect(() => parseStandTrafficResponse({ ...report, stands: [{ standCode: "A1", recentCheckIns: -1 }] })).toThrow(
      "stands[0].recentCheckIns",
    );
  });
});
