import { canReachTarget } from "@features/pwa/lib/reconnect-probe";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  Object.defineProperty(globalThis, "fetch", { value: fetchMock, configurable: true, writable: true });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "fetch");
  jest.useRealTimers();
});

describe("canReachTarget", () => {
  it("asks the destination without cache and answers true when it responds well", async () => {
    fetchMock.mockResolvedValue({ ok: true, url: "http://localhost/passport" });

    await expect(canReachTarget("/passport")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/passport",
      expect.objectContaining({ cache: "no-store", credentials: "same-origin", signal: expect.any(AbortSignal) }),
    );
  });

  it("answers true when the destination redirects to a page that responds well", async () => {
    fetchMock.mockResolvedValue({ ok: true, url: "http://localhost/register" });

    await expect(canReachTarget("/passport")).resolves.toBe(true);
  });

  it("answers false when the server answers with an error", async () => {
    fetchMock.mockResolvedValue({ ok: false, url: "http://localhost/passport" });

    await expect(canReachTarget("/passport")).resolves.toBe(false);
  });

  it("answers false when the request fails, as it does without a route to the server", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(canReachTarget("/passport")).resolves.toBe(false);
  });

  it("does not count the offline page itself as an answer", async () => {
    fetchMock.mockResolvedValue({ ok: true, url: "http://localhost/offline?from=%2Fpassport" });

    await expect(canReachTarget("/passport")).resolves.toBe(false);
  });

  it("gives up with a timeout instead of waiting for a server that never answers", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_target: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    const result = canReachTarget("/passport", 4000);

    await jest.advanceTimersByTimeAsync(4000);

    await expect(result).resolves.toBe(false);
  });
});
