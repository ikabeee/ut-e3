import { runServiceWorker, type ServiceWorkerScope } from "@features/offline/lib/service-worker";
import type { ServiceWorkerConfig } from "@features/offline/lib/service-worker-config";
import { extractStaticAssetUrls, getRequestStrategy } from "@features/offline/lib/service-worker-strategies";

// jsdom no trae Response ni la Cache API: se simulan con lo mínimo que usa el worker.
class FakeResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly redirected = false;
  readonly body: string | null;

  constructor(body: string | null = null, init: { status?: number } = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
  }

  static error() {
    return new FakeResponse(null, { status: 0 });
  }

  clone() {
    return new FakeResponse(this.body, { status: this.status });
  }

  async text() {
    return this.body ?? "";
  }
}

const keyOf = (request: RequestInfo | URL) =>
  typeof request === "string" ? request : String((request as Request).url ?? request);

class FakeCache {
  readonly entries = new Map<string, FakeResponse>();

  async match(request: RequestInfo | URL) {
    return this.entries.get(keyOf(request));
  }

  async put(request: RequestInfo | URL, response: FakeResponse) {
    this.entries.set(keyOf(request), response);
  }

  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }

  async delete(request: RequestInfo | URL) {
    return this.entries.delete(keyOf(request));
  }
}

class FakeCacheStorage {
  readonly caches = new Map<string, FakeCache>();

  async open(name: string) {
    if (!this.caches.has(name)) this.caches.set(name, new FakeCache());

    return this.caches.get(name)!;
  }

  async keys() {
    return [...this.caches.keys()];
  }

  async delete(name: string) {
    return this.caches.delete(name);
  }

  async match(request: RequestInfo | URL) {
    for (const cache of this.caches.values()) {
      const found = await cache.match(request);

      if (found) return found;
    }

    return undefined;
  }
}

const ORIGIN = "https://showcase.example";

function fakeHeaders(init: Record<string, string> = {}) {
  const values = new Map(Object.entries(init).map(([key, value]) => [key.toLowerCase(), value]));

  return {
    has: (name: string) => values.has(name.toLowerCase()),
    get: (name: string) => values.get(name.toLowerCase()) ?? null,
  };
}

const config: ServiceWorkerConfig = {
  version: "v2",
  cachePrefix: "ut-e3",
  precacheUrls: ["/", "/offline"],
  precacheAssetUrls: ["/icons/icon-192.png", "/manifest.webmanifest"],
  offlineUrl: "/offline",
  networkTimeoutMs: 20,
  maxImageEntries: 2,
  skipWaitingMessage: "SKIP_WAITING",
};

type Listener = (event: unknown) => void;

type NetworkHandler = (url: string) => Promise<FakeResponse>;

function setup(network: NetworkHandler) {
  const listeners = new Map<string, Listener>();
  const storage = new FakeCacheStorage();

  const scope = {
    location: { origin: ORIGIN },
    caches: storage,
    fetch: jest.fn((input: RequestInfo | URL) => network(keyOf(input))),
    skipWaiting: jest.fn(async () => undefined),
    clients: { claim: jest.fn(async () => undefined) },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
  };

  runServiceWorker(scope as unknown as ServiceWorkerScope, config, { getRequestStrategy, extractStaticAssetUrls });

  async function lifecycle(type: "install" | "activate") {
    let done: Promise<unknown> = Promise.resolve();
    listeners.get(type)?.({ waitUntil: (promise: Promise<unknown>) => (done = promise) });

    return done;
  }

  async function request(
    path: string,
    init: { mode?: string; method?: string; headers?: Record<string, string> } = {},
  ) {
    let response: Promise<FakeResponse> | undefined;
    listeners.get("fetch")?.({
      request: {
        url: `${ORIGIN}${path}`,
        method: init.method ?? "GET",
        mode: init.mode ?? "no-cors",
        destination: "",
        headers: fakeHeaders(init.headers),
      },
      respondWith: (promise: Promise<FakeResponse>) => (response = promise),
    });

    return response;
  }

  return { scope, storage, listeners, lifecycle, request };
}

const offline: NetworkHandler = () => Promise.reject(new TypeError("Failed to fetch"));

const pageCache = (storage: FakeCacheStorage) => storage.caches.get("ut-e3-pages-v2");

const originalResponse = globalThis.Response;

beforeAll(() => {
  globalThis.Response = FakeResponse as unknown as typeof Response;
});

afterAll(() => {
  globalThis.Response = originalResponse;
});

describe("runServiceWorker: install", () => {
  it("precaches the pages and the hashed files they use, including fonts referenced by CSS", async () => {
    const files: Record<string, string> = {
      [`${ORIGIN}/`]: '<link href="/_next/static/chunks/app.css"><script src="/_next/static/chunks/main.js">',
      [`${ORIGIN}/offline`]: '<script src="/_next/static/chunks/main.js">',
      [`${ORIGIN}/_next/static/chunks/app.css`]: "@font-face{src:url(../media/font.woff2)}",
      [`${ORIGIN}/_next/static/chunks/main.js`]: "console.log(1)",
      [`${ORIGIN}/_next/static/media/font.woff2`]: "font",
      [`${ORIGIN}/icons/icon-192.png`]: "png",
    };

    const { storage, lifecycle } = setup(
      async (url) => new FakeResponse(files[url] ?? null, { status: files[url] ? 200 : 404 }),
    );

    await lifecycle("install");

    expect([...pageCache(storage)!.entries.keys()]).toEqual([`${ORIGIN}/`, `${ORIGIN}/offline`]);
    expect([...storage.caches.get("ut-e3-static-v2")!.entries.keys()].sort()).toEqual([
      `${ORIGIN}/_next/static/chunks/app.css`,
      `${ORIGIN}/_next/static/chunks/main.js`,
      `${ORIGIN}/_next/static/media/font.woff2`,
      `${ORIGIN}/icons/icon-192.png`,
    ]);
  });

  it("fails when the offline page cannot be stored, so the browser retries on the next visit", async () => {
    const { lifecycle } = setup(
      async (url) => new FakeResponse("<html>", { status: url.endsWith("/offline") ? 500 : 200 }),
    );

    await expect(lifecycle("install")).rejects.toThrow("página sin conexión");
  });
});

describe("runServiceWorker: activate and updates", () => {
  it("deletes the caches of other versions, keeps unrelated caches and claims the open pages", async () => {
    const { storage, scope, lifecycle } = setup(offline);
    await storage.open("ut-e3-pages-v1");
    await storage.open("ut-e3-static-v2");
    await storage.open("another-app");

    await lifecycle("activate");

    expect(await storage.keys()).toEqual(["ut-e3-static-v2", "another-app"]);
    expect(scope.clients.claim).toHaveBeenCalled();
  });

  it("waits for the page to accept the update before activating", async () => {
    const { scope, listeners } = setup(offline);
    listeners.get("message")?.({ data: { type: "OTHER" } });
    expect(scope.skipWaiting).not.toHaveBeenCalled();

    listeners.get("message")?.({ data: { type: "SKIP_WAITING" } });
    expect(scope.skipWaiting).toHaveBeenCalled();
  });
});

describe("runServiceWorker: fetch", () => {
  it("serves a page from the network and keeps a copy without the query string", async () => {
    const { storage, request } = setup(async () => new FakeResponse("fresh"));

    const response = await request("/games?genre=Puzle", { mode: "navigate" });

    expect(await response?.text()).toBe("fresh");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await pageCache(storage)?.match(`${ORIGIN}/games`)).toBeDefined();
  });

  it("serves the stored page without network, and /offline for pages that were never stored", async () => {
    const { storage, request } = setup(offline);
    const pages = await storage.open("ut-e3-pages-v2");
    await pages.put(`${ORIGIN}/games`, new FakeResponse("stored games"));
    await pages.put(`${ORIGIN}/offline`, new FakeResponse("offline page"));

    expect(await (await request("/games", { mode: "navigate" }))?.text()).toBe("stored games");
    expect(await (await request("/not-stored", { mode: "navigate" }))?.text()).toBe("offline page");
  });

  it("answers with the stored page when the network takes longer than the time limit", async () => {
    const { storage, request } = setup(() => new Promise(() => undefined));
    const pages = await storage.open("ut-e3-pages-v2");
    await pages.put(`${ORIGIN}/floor-plan`, new FakeResponse("stored plan"));

    expect(await (await request("/floor-plan", { mode: "navigate" }))?.text()).toBe("stored plan");
  });

  it("turns a failed RSC request into a 503 so Next falls back to a full navigation", async () => {
    const { request } = setup(offline);

    expect((await request("/games?_rsc=1a2b", { headers: { RSC: "1" } }))?.status).toBe(503);
  });

  it("serves hashed files from the cache without touching the network", async () => {
    const { storage, scope, request } = setup(offline);
    const files = await storage.open("ut-e3-static-v2");
    await files.put(`${ORIGIN}/_next/static/chunks/main.js`, new FakeResponse("js"));

    expect(await (await request("/_next/static/chunks/main.js"))?.text()).toBe("js");
    expect(scope.fetch).not.toHaveBeenCalled();
  });

  it("serves a precached app icon without network", async () => {
    const { storage, request } = setup(offline);
    const files = await storage.open("ut-e3-static-v2");
    await files.put(`${ORIGIN}/icons/icon-192.png`, new FakeResponse("png"));

    expect(await (await request("/icons/icon-192.png"))?.text()).toBe("png");
  });

  it("keeps at most maxImageEntries images", async () => {
    const { storage, request } = setup(async (url) => new FakeResponse(url));

    for (const name of ["a", "b", "c"]) await request(`/mock/games/${name}.png`);

    expect([...storage.caches.get("ut-e3-images-v2")!.entries.keys()]).toEqual([
      `${ORIGIN}/mock/games/b.png`,
      `${ORIGIN}/mock/games/c.png`,
    ]);
  });

  it("falls back to the stored API response without network", async () => {
    const { storage, request } = setup(offline);
    const api = await storage.open("ut-e3-api-v2");
    await api.put(`${ORIGIN}/api/games`, new FakeResponse("[]"));

    expect(await (await request("/api/games"))?.text()).toBe("[]");
  });

  it("leaves the reel video and non GET requests to the browser", async () => {
    const { request } = setup(offline);

    expect(await request("/media/reel.webm")).toBeUndefined();
    expect(await request("/games", { method: "POST" })).toBeUndefined();
  });
});
