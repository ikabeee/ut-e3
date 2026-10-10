// Matchers de DOM para las pruebas (`toBeInTheDocument`, `toHaveAttribute`, ...).
import "@testing-library/jest-dom";

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

// jsdom tampoco dibuja en canvas: sin contexto 2D, el arte generado simplemente no se pinta.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
