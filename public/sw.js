// Service worker of the visitor app (RNF-14). It is a classic script written by hand: no build step, no dependency.
// The rules of what it caches live in /sw-policy.js (pure functions with tests); this file only wires them to the
// events of the worker. See odd/tasks/pwa.md.

importScripts("/sw-policy.js");

const policy = globalThis.swPolicy;

const HTML_HEADERS = { Accept: "text/html" };

const ASSET_BATCH_SIZE = 6;

const SHELL_PATHS = ["/", policy.OFFLINE_PATH];

self.addEventListener("install", (event) => {
  event.waitUntil(precachePages(SHELL_PATHS).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteStaleCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const kind = policy.classifyRequest(describeRequest(event.request), self.location.origin);
  const handler = HANDLERS[kind];

  if (handler) event.respondWith(handler(event));
});

// The pages ask for the public pages to be saved ahead of time (the catalog and every game); the worker only accepts
// public paths, so a page cannot make it store anything else.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache") return;

  event.waitUntil(precachePages(policy.filterPrecachePaths(event.data.paths ?? [])));
});

const HANDLERS = {
  "public-page": handlePublicPage,
  "passport-page": handlePassportPage,
  asset: handleAsset,
  image: handleImage,
};

function describeRequest(request) {
  return {
    method: request.method,
    url: request.url,
    mode: request.mode,
    destination: request.destination,
    hasRscHeader: request.headers.get("RSC") === "1",
  };
}

// Network first, so a visitor online always sees the latest page; the saved copy only answers when there is no network.
async function handlePublicPage(event) {
  const path = new URL(event.request.url).pathname;
  const hasCopy = (await matchPage(path)) !== undefined;

  try {
    const response = await fetchWithTimeout(event.request, hasCopy ? policy.NETWORK_TIMEOUT_MS : 0);

    event.waitUntil(storePage(path, response.clone()));

    return response;
  } catch {
    return (await matchPage(path)) ?? redirectToOffline(path);
  }
}

// The passport is never stored by the worker: it depends on the device cookie. Without a network the visitor is sent to
// /offline, which shows the copy that the phone saved by itself.
async function handlePassportPage(event) {
  try {
    return await fetch(event.request);
  } catch {
    return redirectToOffline(policy.PASSPORT_PATH);
  }
}

// /offline is itself a saved page: if even that fails there is nothing left to show.
function redirectToOffline(fromPath) {
  if (fromPath === policy.OFFLINE_PATH) return Response.error();

  return Response.redirect(new URL(policy.buildOfflineRedirectPath(fromPath), self.location.origin).href, 302);
}

// The files of /_next/static have a hash in their name: once saved they never change.
async function handleAsset(event) {
  const cache = await caches.open(policy.CACHE_NAMES.assets);
  const saved = await cache.match(event.request);

  if (saved) return saved;

  const response = await fetch(event.request);

  if (isCacheable(response)) event.waitUntil(cache.put(event.request, response.clone()));

  return response;
}

// Images answer from the copy and refresh it in the background; the cache keeps the most recent ones only.
async function handleImage(event) {
  const cache = await caches.open(policy.CACHE_NAMES.images);
  const saved = await cache.match(event.request);
  const refresh = refreshImage({ cache, request: event.request });

  event.waitUntil(refresh.catch(() => undefined));

  return saved ?? refresh;
}

async function refreshImage({ cache, request }) {
  const response = await fetch(request);

  if (isCacheable(response)) await storeImage({ cache, request, response });

  return response;
}

async function storeImage({ cache, request, response }) {
  await cache.put(request, response.clone());
  await trimCache(cache, policy.MAX_IMAGE_ENTRIES);
}

async function trimCache(cache, max) {
  const keys = await cache.keys();

  await Promise.all(policy.selectEvictions(keys, max).map((key) => cache.delete(key)));
}

// One page at a time and a few files at a time: hundreds of simultaneous requests make the browser refuse them
// (ERR_INSUFFICIENT_RESOURCES) and would compete with the page that the visitor is looking at.
async function precachePages(paths) {
  for (const path of paths) {
    await fetchAndStorePage(path).catch(() => undefined);
  }
}

// Credentials are omitted: what is stored is the page an anonymous visitor gets, never one made for a signed-in account.
async function fetchAndStorePage(path) {
  const response = await fetch(path, { credentials: "omit", headers: HTML_HEADERS });

  await storePage(path, response);
}

async function storePage(path, response) {
  if (!isCacheable(response)) return;

  const html = await response.clone().text();
  const cache = await caches.open(policy.CACHE_NAMES.pages);

  await cache.put(path, response);
  await storeAssets(policy.extractAssetUrls(html));
}

async function storeAssets(urls) {
  for (let start = 0; start < urls.length; start += ASSET_BATCH_SIZE) {
    const batch = urls.slice(start, start + ASSET_BATCH_SIZE);

    await Promise.allSettled(batch.map((url) => fetchAndStoreAsset(url)));
  }
}

async function fetchAndStoreAsset(url) {
  const cacheName = url.startsWith("/_next/image") ? policy.CACHE_NAMES.images : policy.CACHE_NAMES.assets;
  const cache = await caches.open(cacheName);

  if (await cache.match(url)) return;

  const response = await fetch(url, { credentials: "omit" });

  if (isCacheable(response)) await cache.put(url, response);
}

async function matchPage(path) {
  return caches.match(path, { cacheName: policy.CACHE_NAMES.pages });
}

// Without a timeout (0) the request waits for the network as long as the browser does.
function fetchWithTimeout(request, timeoutMs) {
  if (timeoutMs === 0) return fetch(request);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function isCacheable(response) {
  return policy.isCacheableResponse({
    status: response.status,
    type: response.type,
    cacheControl: response.headers.get("Cache-Control"),
  });
}

async function deleteStaleCaches() {
  const names = await caches.keys();

  await Promise.all(policy.listStaleCacheNames(names).map((name) => caches.delete(name)));
}
