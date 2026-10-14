/**
 * @jest-environment node
 */
import { createOfflineRoute } from "@features/offline/api/offline-route";
import { getServiceWorkerScript } from "@features/offline/lib/server/service-worker-queries";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

describe("GET /sw.js", () => {
  it("responds with the service worker script", async () => {
    const route = createOfflineRoute(async () => getServiceWorkerScript(async () => GAME_FIXTURES.slice(0, 1)));
    const response = await route();
    const script = await response.text();

    expect(response.headers.get("content-type")).toBe("application/javascript; charset=utf-8");
    expect(script).toContain(`/games/${GAME_FIXTURES[0].slug}`);
  });
});
