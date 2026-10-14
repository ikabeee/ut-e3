import {
  extractStaticAssetUrls,
  getRequestStrategy,
  type StrategyRequest,
} from "@features/offline/lib/service-worker-strategies";

const ORIGIN = "https://showcase.example";

// Cabeceras mínimas (has/get sin distinguir mayúsculas), independientes del entorno de pruebas.
function headers(init: Record<string, string> = {}) {
  const values = new Map(Object.entries(init).map(([key, value]) => [key.toLowerCase(), value]));

  // SAFETY: El objeto solo implementa has y get para satisfacer el uso de Headers en las pruebas.
  return {
    has: (name: string) => values.has(name.toLowerCase()),
    get: (name: string) => values.get(name.toLowerCase()) ?? null,
  } as Headers;
}

function request(path: string, overrides: Partial<StrategyRequest> = {}): StrategyRequest {
  return {
    url: path.startsWith("http") ? path : `${ORIGIN}${path}`,
    method: "GET",
    mode: "no-cors",
    destination: "",
    headers: headers(),
    ...overrides,
  };
}

describe("getRequestStrategy", () => {
  it.each([
    ["/_next/static/chunks/app.js", {}, "static"],
    ["/games", { mode: "navigate" as const }, "page"],
    ["/games/ruta-9", { mode: "navigate" as const }, "page"],
    ["/games?_rsc=abc", {}, "rsc"],
    ["/games", { headers: headers({ RSC: "1" }) }, "rsc"],
    ["/_next/image?url=%2Fmock%2Fgames%2Fa.png&w=640&q=75", {}, "image"],
    ["/games/ruta-9.png", {}, "image"],
    ["/media/reel.jpg", { destination: "image" as const }, "image"],
    ["/api/games", {}, "api"],
    ["/manifest.webmanifest", {}, "network"],
    ["/administration-guide", { mode: "navigate" as const }, "page"],
    ["/passport", { mode: "navigate" as const }, "private-page"],
    ["/v/0123456789abcdef0123456789abcdef", { mode: "navigate" as const }, "private-page"],
    ["/passport?_rsc=abc", {}, "rsc"],
    ["/passport-guide", { mode: "navigate" as const }, "page"],
  ])("%s -> %s", (path, overrides, expected) => {
    expect(getRequestStrategy(request(path, overrides), ORIGIN)).toBe(expected);
  });

  it.each([
    ["the reel video", request("/media/reel.webm")],
    ["the mp4 reel", request("/media/reel.mp4", { destination: "video" })],
    ["range requests", request("/media/reel.jpg", { headers: headers({ range: "bytes=0-" }) })],
    ["other origins", request("https://fonts.example/font.woff2")],
    ["non GET requests", request("/games", { method: "POST", mode: "navigate" })],
    ["the service worker itself", request("/sw.js")],
    ["the admin panel", request("/admin", { mode: "navigate" })],
    ["admin sections", request("/admin/raffle", { mode: "navigate" })],
    ["admin RSC requests", request("/admin/teams", { headers: headers({ RSC: "1" }) })],
  ])("never handles %s", (_name, req) => {
    expect(getRequestStrategy(req, ORIGIN)).toBe("bypass");
  });
});

describe("extractStaticAssetUrls", () => {
  it("finds scripts, styles and fonts referenced by the HTML, including the escaped RSC payload", () => {
    const html = `
      <link rel="stylesheet" href="/_next/static/chunks/app.css" />
      <script src="/_next/static/chunks/main.js" async></script>
      <script>self.__next_f.push([1,"I[\\"/_next/static/chunks/page.js\\"]"])</script>
      <img src="/games/ruta-9.png" />
      <script src="https://cdn.example/_next/static/chunks/external.js"></script>`;

    expect(extractStaticAssetUrls(html, `${ORIGIN}/games`, ORIGIN)).toEqual([
      `${ORIGIN}/_next/static/chunks/app.css`,
      `${ORIGIN}/_next/static/chunks/main.js`,
      `${ORIGIN}/_next/static/chunks/page.js`,
    ]);
  });

  it("resolves relative font URLs of a stylesheet and skips data URIs", () => {
    const css = `@font-face{src:url(../media/archivo.woff2) format("woff2")}
      .a{background:url("data:image/svg+xml;utf8,<svg/>")}`;

    expect(extractStaticAssetUrls(css, `${ORIGIN}/_next/static/chunks/app.css`, ORIGIN)).toEqual([
      `${ORIGIN}/_next/static/media/archivo.woff2`,
    ]);
  });
});
