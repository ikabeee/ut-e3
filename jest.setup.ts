// Matchers de DOM para las pruebas (`toBeInTheDocument`, `toHaveAttribute`, ...).
import "@testing-library/jest-dom";

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
