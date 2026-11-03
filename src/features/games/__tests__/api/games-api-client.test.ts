import { restoreFetch, stubFetch } from "@features/games/__tests__/api/fetch-stub";
import { fetchItchLink } from "@features/games/api/games-api-client";

afterEach(() => {
  restoreFetch();
});

describe("fetchItchLink", () => {
  it("asks the route of the game without using the browser cache and returns the link the server decided", async () => {
    const fetchStub = stubFetch(async () => ({
      status: 200,
      body: { link: { status: "open", url: "https://utg.itch.io/x" } },
    }));

    expect(await fetchItchLink("ruta-9")).toEqual({ status: "open", url: "https://utg.itch.io/x" });
    expect(fetchStub).toHaveBeenCalledWith("/api/games/ruta-9/itch", { cache: "no-store" });
  });

  it("returns null for an error, for an answer of another shape and for a network failure", async () => {
    stubFetch(async () => ({ status: 404, body: {} }));
    expect(await fetchItchLink("ruta-9")).toBeNull();

    stubFetch(async () => ({ status: 200, body: { link: { status: "open" } } }));
    expect(await fetchItchLink("ruta-9")).toBeNull();

    stubFetch(async () => {
      throw new TypeError("offline");
    });
    expect(await fetchItchLink("ruta-9")).toBeNull();
  });
});
