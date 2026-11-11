import { loadSwPolicy, type WorkerRequest } from "@features/pwa/__tests__/lib/load-sw-policy";

const ORIGIN = "https://showcase.example";

const policy = loadSwPolicy();

describe("classifyRequest: the pages the worker answers for (RNF-14)", () => {
  it.each(["/", "/games", "/games/ruta-9", "/sponsors", "/privacy", "/offline"])(
    "treats the navigation to %s as a public page",
    (pathname) => {
      expect(classify(navigation(pathname))).toBe("public-page");
    },
  );

  it("treats the navigation to the passport as its own case, never as a page to store", () => {
    expect(classify(navigation("/passport"))).toBe("passport-page");
  });

  it.each([
    "/admin",
    "/admin/kof",
    "/stand/kiosk",
    "/stand/game",
    "/stand/team",
    "/support/recovery",
    "/tournament",
    "/login",
    "/activate/abc123",
    "/register",
    "/passport/claim/abc123",
    "/games/ruta-9/extra",
    "/games/",
    "/api/stand/visit-status",
    "/api/pwa/precache",
    "/api/games/ruta-9/itch",
  ])("ignores the navigation to %s: the staff areas, the account pages and /api are never answered", (pathname) => {
    expect(classify(navigation(pathname))).toBe("ignore");
  });

  it("does not match a path that only starts like a public one", () => {
    expect(classify(navigation("/games-admin"))).toBe("ignore");
    expect(classify(navigation("/sponsors/secret"))).toBe("ignore");
  });
});

describe("classifyRequest: requests that are not page loads", () => {
  it("ignores whatever is not a GET, such as a Server Action", () => {
    expect(classify({ ...navigation("/games"), method: "POST" })).toBe("ignore");
  });

  it("ignores the data requests of the framework (RSC) so client navigation keeps working", () => {
    expect(classify({ ...navigation("/games"), url: `${ORIGIN}/games?_rsc=1abc` })).toBe("ignore");
    expect(classify({ ...navigation("/games"), hasRscHeader: true })).toBe("ignore");
  });

  it("ignores another origin", () => {
    expect(classify({ ...navigation("/games"), url: "https://other.example/games" })).toBe("ignore");
  });

  it("never touches the map tiles of another origin", () => {
    const tile = {
      ...resource("/dark_all/17/30000/55000@2x.png", "image"),
      url: "https://a.basemaps.cartocdn.com/dark_all/17/30000/55000@2x.png",
    };

    expect(classify(tile)).toBe("ignore");
  });

  it("answers for the static files of the build and for the optimized images", () => {
    expect(classify(resource("/_next/static/chunks/app-1a2b.js", "script"))).toBe("asset");
    expect(classify(resource("/_next/static/media/font.woff2", "font"))).toBe("asset");
    expect(classify(resource("/_next/image", "image"))).toBe("image");
  });

  it("answers for the public images, and only when they are loaded as images", () => {
    expect(classify(resource("/games/ruta-9.jpg", "image"))).toBe("image");
    expect(classify(resource("/sponsors/logo.png", "image"))).toBe("image");
    expect(classify(resource("/games/ruta-9.jpg", ""))).toBe("ignore");
  });

  it("ignores any other file", () => {
    expect(classify(resource("/admin/export.csv", ""))).toBe("ignore");
    expect(classify(resource("/sw.js", "script"))).toBe("ignore");
  });
});

describe("isCacheableResponse: no-store and private are always respected", () => {
  it("accepts a complete answer of this site", () => {
    expect(policy.isCacheableResponse({ status: 200, type: "basic", cacheControl: "public, max-age=0" })).toBe(true);
    expect(policy.isCacheableResponse({ status: 200, type: "basic", cacheControl: null })).toBe(true);
  });

  it.each(["no-store", "private, no-cache, no-store, max-age=0, must-revalidate", "private", "No-Store"])(
    "refuses an answer with Cache-Control %s",
    (cacheControl) => {
      expect(policy.isCacheableResponse({ status: 200, type: "basic", cacheControl })).toBe(false);
    },
  );

  it("refuses errors, redirects and answers from other origins or opaque ones", () => {
    expect(policy.isCacheableResponse({ status: 404, type: "basic", cacheControl: null })).toBe(false);
    expect(policy.isCacheableResponse({ status: 302, type: "basic", cacheControl: null })).toBe(false);
    expect(policy.isCacheableResponse({ status: 200, type: "opaque", cacheControl: null })).toBe(false);
    expect(policy.isCacheableResponse({ status: 200, type: "cors", cacheControl: null })).toBe(false);
  });
});

describe("the versioned caches", () => {
  it("names every cache with the version, so changing it invalidates them all", () => {
    expect(policy.CACHE_VERSION).toBe("v1");
    expect(Object.values(policy.CACHE_NAMES)).toEqual(["pwa-pages-v1", "pwa-assets-v1", "pwa-images-v1"]);
  });

  it("deletes the caches of an older version and nothing else", () => {
    const names = [...Object.values(policy.CACHE_NAMES), "pwa-pages-v0", "pwa-assets-v0", "other-app-cache", "workbox"];

    expect(policy.listStaleCacheNames(names)).toEqual(["pwa-pages-v0", "pwa-assets-v0"]);
  });

  it("deletes the oldest images once the limit is passed", () => {
    expect(policy.selectEvictions(["a", "b", "c", "d"], 3)).toEqual(["a"]);
    expect(policy.selectEvictions(["a", "b"], 3)).toEqual([]);
    expect(policy.selectEvictions(["a", "b"], 0)).toEqual(["a", "b"]);
  });
});

describe("extractAssetUrls", () => {
  it("reads the static files and the images that a page loads", () => {
    const html = `<link rel="stylesheet" href="/_next/static/chunks/app.css"/>
      <script src="/_next/static/chunks/main-1.js" async=""></script>
      <img src="/_next/image?url=%2Fgames%2Fruta-9.jpg&amp;w=640&amp;q=75"/>
      <a href="/admin">staff</a><img src="https://other.example/x.png"/>`;

    expect(policy.extractAssetUrls(html)).toEqual([
      "/_next/static/chunks/app.css",
      "/_next/static/chunks/main-1.js",
      "/_next/image?url=%2Fgames%2Fruta-9.jpg&w=640&q=75",
    ]);
  });

  it("also finds the chunks that Next names inside the data it sends with the HTML", () => {
    const html =
      'self.__next_f.push([1,"I[64893,[\\"/_next/static/chunks/c1.js\\",\\"/_next/static/chunks/c2.css\\"],\\"default\\"]"])';

    expect(policy.extractAssetUrls(html)).toEqual(["/_next/static/chunks/c1.js", "/_next/static/chunks/c2.css"]);
  });

  it("lists each file once and stops at a limit", () => {
    const repeated = '<script src="/_next/static/a.js"></script>'.repeat(3);

    const many = Array.from({ length: 300 }, (_, index) => `<script src="/_next/static/f${index}.js"></script>`).join(
      "",
    );

    expect(policy.extractAssetUrls(repeated)).toEqual(["/_next/static/a.js"]);
    expect(policy.extractAssetUrls(many)).toHaveLength(150);
  });

  it("keeps the scripts and styles even when the page names hundreds of fonts before them", () => {
    const fonts = Array.from({ length: 250 }, (_, index) => `"/_next/static/media/f${index}.woff2"`).join(",");
    const html = `${fonts},"/_next/static/chunks/page.js","/_next/static/chunks/page.css"`;
    const urls = policy.extractAssetUrls(html);

    expect(urls.slice(0, 2)).toEqual(["/_next/static/chunks/page.js", "/_next/static/chunks/page.css"]);
    expect(urls.filter((url) => url.endsWith(".woff2"))).toHaveLength(30);
  });
});

describe("the messages from the pages", () => {
  it("only accepts public pages to precache, so a page cannot make the worker store anything else", () => {
    const paths = ["/games", "/games/ruta-9", "/admin", "/passport", "/api/x", "/games", "https://evil.example/"];

    expect(policy.filterPrecachePaths(paths)).toEqual(["/games", "/games/ruta-9"]);
  });

  it("sends a navigation with nothing to show to /offline and remembers where it was going", () => {
    expect(policy.buildOfflineRedirectPath("/games/ruta-9")).toBe("/offline?from=%2Fgames%2Fruta-9");
    expect(policy.buildOfflineRedirectPath("/passport")).toBe("/offline?from=%2Fpassport");
  });
});

function classify(request: WorkerRequest): string {
  return policy.classifyRequest(request, ORIGIN);
}

function navigation(pathname: string): WorkerRequest {
  return { method: "GET", url: `${ORIGIN}${pathname}`, mode: "navigate", destination: "document" };
}

function resource(pathname: string, destination: string): WorkerRequest {
  return { method: "GET", url: `${ORIGIN}${pathname}`, mode: "no-cors", destination };
}
