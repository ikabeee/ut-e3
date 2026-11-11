import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

export interface WorkerRequest {
  method: string;
  url: string;
  mode: string;
  destination: string;
  hasRscHeader?: boolean;
}

export interface SwPolicy {
  CACHE_VERSION: string;
  CACHE_PREFIX: string;
  CACHE_NAMES: { pages: string; assets: string; images: string };
  OFFLINE_PATH: string;
  PASSPORT_PATH: string;
  MAX_IMAGE_ENTRIES: number;
  NETWORK_TIMEOUT_MS: number;
  classifyRequest: (request: WorkerRequest, origin: string) => string;
  isPublicPagePath: (pathname: string) => boolean;
  isCacheableResponse: (response: { status: number; type: string; cacheControl: string | null }) => boolean;
  listStaleCacheNames: (names: string[]) => string[];
  selectEvictions: (keys: string[], max: number) => string[];
  extractAssetUrls: (html: string) => string[];
  buildOfflineRedirectPath: (pathname: string) => string;
  filterPrecachePaths: (paths: string[]) => string[];
}

interface WorkerScope {
  URL: typeof URL;
  URLSearchParams: typeof URLSearchParams;
  swPolicy?: SwPolicy;
}

/**
 * Runs public/sw-policy.js the way the worker does: a classic script in a scope of its own, where `globalThis` is the
 * scope. The tests check the real file, not a copy of its rules.
 */
export function loadSwPolicy(): SwPolicy {
  const scope: WorkerScope = { URL, URLSearchParams };
  const source = readFileSync(path.join(process.cwd(), "public", "sw-policy.js"), "utf8");

  // The script is this repository's own public/sw-policy.js, read from disk; it is run in a scope of its own.
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(source, scope);

  if (!scope.swPolicy) throw new Error("public/sw-policy.js did not define swPolicy");

  return scope.swPolicy;
}
