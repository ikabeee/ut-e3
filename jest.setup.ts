// Matchers de DOM para las pruebas (`toBeInTheDocument`, `toHaveAttribute`, ...).
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

if (typeof global.Request === "undefined" && typeof Request !== "undefined") {
  global.Request = Request as unknown as typeof global.Request;
  global.Response = Response as unknown as typeof global.Response;
  global.Headers = Headers as unknown as typeof global.Headers;
  global.fetch = fetch as unknown as typeof global.fetch;
}

// Las pruebas de Route Handlers corren en el entorno `node` (`@jest-environment node`), que no
// tiene `window`: ahí no hace falta simular las APIs del navegador.
if (typeof window !== "undefined") {
  // jsdom no implementa matchMedia ni ResizeObserver; se simulan con valores neutros.
  // Cada prueba puede reemplazarlos (por ejemplo, para simular `prefers-reduced-motion`).
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

  // jsdom tampoco tiene la API de tipografías: se resuelve de inmediato, como si ya estuvieran cargadas.
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
}
