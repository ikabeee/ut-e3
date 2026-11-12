// Cache policy of the service worker (public/sw.js). Pure functions only: no caches, no fetch, no worker globals, so
// the Jest tests of src/features/pwa load this same file and check the rules the worker applies.
//
// Bump CACHE_VERSION to invalidate every cache the worker owns: on activate, the worker deletes the caches whose
// name starts with CACHE_PREFIX and is not in CACHE_NAMES.
//
// What is cached: the public pages (RNF-14), the static assets those pages load and their images. What is never cached:
// /passport (it reads the device cookie; the offline copy lives in the phone, see passport-snapshot.ts), the staff
// areas, /api and any response that says no-store or private.

const CACHE_VERSION = "v1";

const CACHE_PREFIX = "pwa-";

const CACHE_NAMES = Object.freeze({
  pages: `${CACHE_PREFIX}pages-${CACHE_VERSION}`,
  assets: `${CACHE_PREFIX}assets-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
});

const OFFLINE_PATH = "/offline";

const PASSPORT_PATH = "/passport";

const GAME_DETAIL_PREFIX = "/games/";

const PUBLIC_PAGE_PATHS = Object.freeze(["/", "/games", "/sponsors", "/floor-plan", "/privacy", OFFLINE_PATH]);

const IMAGE_PATH_PREFIXES = Object.freeze(["/games/", "/media/", "/sponsors/", "/icons/"]);

const MAX_IMAGE_ENTRIES = 150;

const MAX_ASSETS_PER_PAGE = 150;

const MAX_FONTS_PER_PAGE = 30;

const CODE_FILE_PATTERN = /\.(?:js|css)(?:\?|$)/;

const NETWORK_TIMEOUT_MS = 4000;

// The files of a page appear in its tags and also inside the data that Next sends with the HTML (the chunks of each
// client component), so every mention of /_next/static or /_next/image counts.
const ASSET_URL_PATTERN = /\/_next\/(?:static\/|image\?)[^"'\\\s<>]*/g;

/**
 * What the worker does with a request: "public-page", "passport-page", "asset", "image" or "ignore". Everything that is
 * not listed here is ignored, so the worker never answers for the staff areas, /api or a Server Action.
 */
function classifyRequest(request, origin) {
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== origin || isFrameworkDataRequest(request, url)) return "ignore";

  if (request.mode === "navigate") return classifyNavigation(url.pathname);

  return classifyResource({ pathname: url.pathname, destination: request.destination });
}

function isFrameworkDataRequest(request, url) {
  return request.hasRscHeader === true || url.searchParams.has("_rsc") || url.pathname.startsWith("/api/");
}

function classifyNavigation(pathname) {
  if (pathname === PASSPORT_PATH) return "passport-page";

  return isPublicPagePath(pathname) ? "public-page" : "ignore";
}

function classifyResource({ pathname, destination }) {
  if (pathname.startsWith("/_next/static/")) return "asset";

  if (pathname === "/_next/image") return "image";

  const isPublicImage = IMAGE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return destination === "image" && isPublicImage ? "image" : "ignore";
}

/** The public pages: the landing, the catalog and each game, the sponsors, the croquis, the privacy notice and the offline page. */
function isPublicPagePath(pathname) {
  if (PUBLIC_PAGE_PATHS.includes(pathname)) return true;

  const slug = pathname.slice(GAME_DETAIL_PREFIX.length);

  return pathname.startsWith(GAME_DETAIL_PREFIX) && slug.length > 0 && !slug.includes("/");
}

/** Only a complete, same-origin answer that does not forbid storing it: no-store and private are always respected. */
function isCacheableResponse({ status, type, cacheControl }) {
  const forbidsStoring = /no-store|private/i.test(cacheControl ?? "");

  return status === 200 && type === "basic" && !forbidsStoring;
}

/** The caches this worker created in an earlier version, which activate deletes. */
function listStaleCacheNames(names) {
  const current = Object.values(CACHE_NAMES);

  return names.filter((name) => name.startsWith(CACHE_PREFIX) && !current.includes(name));
}

/** The oldest entries to delete so a cache of images keeps at most `max`; `keys` come in insertion order. */
function selectEvictions(keys, max) {
  return keys.slice(0, Math.max(0, keys.length - max));
}

/**
 * The static files and images a page needs to render, read from its HTML: they are cached with the page. Scripts and
 * styles come first because the page does not work without them, then the images, and at most MAX_FONTS_PER_PAGE fonts:
 * Next lists hundreds of font subsets and the browser only asks for the ones a page uses, which the worker stores when
 * they are requested.
 */
function extractAssetUrls(html) {
  const urls = [...new Set(Array.from(html.matchAll(ASSET_URL_PATTERN), (match) => decodeHtmlAmpersands(match[0])))];
  const code = urls.filter((url) => CODE_FILE_PATTERN.test(url));
  const images = urls.filter((url) => url.startsWith("/_next/image"));
  const fonts = urls.filter((url) => !CODE_FILE_PATTERN.test(url) && !url.startsWith("/_next/image"));

  return [...code, ...images, ...fonts.slice(0, MAX_FONTS_PER_PAGE)].slice(0, MAX_ASSETS_PER_PAGE);
}

function decodeHtmlAmpersands(value) {
  return value.replaceAll("&amp;", "&");
}

/** Where a navigation goes when there is nothing to show for it: /offline, which remembers the page to return to. */
function buildOfflineRedirectPath(pathname) {
  return `${OFFLINE_PATH}?${new URLSearchParams({ from: pathname })}`;
}

/** The paths from a page that the worker accepts to precache: public pages only, once each. */
function filterPrecachePaths(paths) {
  return [...new Set(paths.map(String))].filter((path) => isPublicPagePath(path));
}

globalThis.swPolicy = Object.freeze({
  CACHE_VERSION,
  CACHE_PREFIX,
  CACHE_NAMES,
  OFFLINE_PATH,
  PASSPORT_PATH,
  MAX_IMAGE_ENTRIES,
  NETWORK_TIMEOUT_MS,
  classifyRequest,
  isPublicPagePath,
  isCacheableResponse,
  listStaleCacheNames,
  selectEvictions,
  extractAssetUrls,
  buildOfflineRedirectPath,
  filterPrecachePaths,
});
