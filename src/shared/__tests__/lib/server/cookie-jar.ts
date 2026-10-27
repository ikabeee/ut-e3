import type * as NextHeaders from "next/headers";
import { NextResponse } from "next/server";

type CookieStore = Awaited<ReturnType<typeof NextHeaders.cookies>>;

// Outside a request `cookies()` throws, so tests hand Server Actions the cookie store Next itself builds for a
// response: `delete` keeps the cookie with an empty value that expired at the epoch, as the browser receives it.
export function createCookieJar(): CookieStore {
  const cookies = NextResponse.next().cookies;

  return {
    get: (...args) => cookies.get(...args),
    getAll: (...args) => cookies.getAll(...args),
    has: (name) => cookies.has(name),
    set: (...args) => cookies.set(...args),
    delete: (...args) => cookies.delete(...args),
    toString: () => cookies.toString(),
    get size() {
      return cookies.getAll().length;
    },
    [Symbol.iterator]: () => new Map(cookies.getAll().map((cookie) => [cookie.name, cookie])).entries(),
  };
}

export function stubCookies(jar: CookieStore) {
  const nextHeaders = jest.requireActual<typeof NextHeaders>("next/headers");

  return jest.spyOn(nextHeaders, "cookies").mockResolvedValue(jar);
}
