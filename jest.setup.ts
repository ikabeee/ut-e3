import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
  // SAFETY: TextDecoder from node:util conforms to global.TextDecoder in test environment.
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

class RequestMock {}

class ResponseMock {}

class HeadersMock implements Headers {
  private readonly map = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        for (const [k, v] of init) {
          this.map.set(k.toLowerCase(), v);
        }
      } else if (init instanceof HeadersMock) {
        init.map.forEach((v, k) => this.map.set(k, v));
      } else {
        for (const [k, v] of Object.entries(init)) {
          this.map.set(k.toLowerCase(), String(v));
        }
      }
    }
  }

  append(name: string, value: string): void {
    const existing = this.get(name);

    this.set(name, existing ? `${existing}, ${value}` : value);
  }

  delete(name: string): void {
    this.map.delete(name.toLowerCase());
  }

  get(name: string): string | null {
    return this.map.get(name.toLowerCase()) ?? null;
  }

  getSetCookie(): string[] {
    const cookie = this.get("set-cookie");

    return cookie ? [cookie] : [];
  }

  has(name: string): boolean {
    return this.map.has(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this.map.set(name.toLowerCase(), value);
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    this.map.forEach((value, key) => callback(value, key, this));
  }

  entries(): HeadersIterator<[string, string]> {
    // SAFETY: MapIterator conforms to HeadersIterator interface in test environment.
    return this.map.entries() as HeadersIterator<[string, string]>;
  }

  keys(): HeadersIterator<string> {
    // SAFETY: MapIterator conforms to HeadersIterator interface in test environment.
    return this.map.keys() as HeadersIterator<string>;
  }

  values(): HeadersIterator<string> {
    // SAFETY: MapIterator conforms to HeadersIterator interface in test environment.
    return this.map.values() as HeadersIterator<string>;
  }

  [Symbol.iterator](): HeadersIterator<[string, string]> {
    return this.entries();
  }
}

if (typeof global.Request === "undefined") {
  // SAFETY: JSDOM does not provide WHATWG Request; minimal class definition allows NextRequest module evaluation.
  global.Request = RequestMock as typeof global.Request;
  // SAFETY: JSDOM does not provide Response; minimal class definition allows NextResponse module evaluation.
  global.Response = ResponseMock as typeof global.Response;
  global.Headers = HeadersMock;
}

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverMock });

  Element.prototype.scrollIntoView = () => undefined;

  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
}
