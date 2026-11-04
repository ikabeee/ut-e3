import "server-only";
import { createHash } from "node:crypto";

/** A screen polls every 3 seconds; one that did not ask in this window left the bracket. */
export const AUDIENCE_WINDOW_MS = 10_000;

const MAX_TRACKED = 5000;

export interface PublicBracketAudience {
  viewers: number;
  requestsPerMinute: number;
}

interface AudienceStore {
  /** Hash of the client to the last time it asked. */
  lastSeen: Map<string, number>;
  /** Requests per second (epoch second to count), for the last minute; one entry per second keeps it cheap. */
  requestsBySecond: Map<number, number>;
}

/**
 * Remembers that a screen asked for the public bracket (RF-73). The bracket is polled, not streamed, so a
 * "connection" is a client that asked in the last seconds. The client is a hash of its address and browser, so
 * many phones behind the same Wi-Fi still count apart; nothing of it is stored in the database.
 */
export function recordPublicBracketRequest(request: Request, now: number = Date.now()): void {
  const store = getStore();

  const second = Math.floor(now / 1000);

  store.lastSeen.set(clientKey(request), now);
  store.requestsBySecond.set(second, (store.requestsBySecond.get(second) ?? 0) + 1);

  if (store.lastSeen.size > MAX_TRACKED || store.requestsBySecond.size > 120) prune(store, now);
}

/** The screens that asked in the last window, and the requests of the last minute. */
export function getPublicBracketAudience(now: number = Date.now()): PublicBracketAudience {
  const store = getStore();

  prune(store, now);

  return {
    viewers: [...store.lastSeen.values()].filter((at) => now - at < AUDIENCE_WINDOW_MS).length,
    requestsPerMinute: [...store.requestsBySecond.values()].reduce((sum, count) => sum + count, 0),
  };
}

function getStore(): AudienceStore {
  const holder: typeof globalThis & { ute3PublicBracketAudience?: AudienceStore } = globalThis;

  holder.ute3PublicBracketAudience ??= { lastSeen: new Map(), requestsBySecond: new Map() };

  return holder.ute3PublicBracketAudience;
}

function clientKey(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const agent = request.headers.get("user-agent") ?? "";

  return createHash("sha256")
    .update(`${address ?? ""}|${agent}`)
    .digest("base64url")
    .slice(0, 16);
}

function prune(store: AudienceStore, now: number): void {
  for (const [key, at] of store.lastSeen) {
    if (now - at >= AUDIENCE_WINDOW_MS) store.lastSeen.delete(key);
  }

  for (const second of store.requestsBySecond.keys()) {
    if (now - second * 1000 >= 60_000) store.requestsBySecond.delete(second);
  }
}
