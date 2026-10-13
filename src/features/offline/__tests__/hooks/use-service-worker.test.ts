import { act, renderHook, waitFor } from "@testing-library/react";
import { useServiceWorker } from "@features/offline/hooks/use-service-worker";

class FakeTarget {
  private readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

class FakeWorker extends FakeTarget {
  state = "installing";
  postMessage = jest.fn();
}

class FakeRegistration extends FakeTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  unregister = jest.fn(async () => true);
}

class FakeContainer extends FakeTarget {
  controller: object | null = null;
  readonly registration = new FakeRegistration();
  register = jest.fn(async () => this.registration);
  getRegistrations = jest.fn(async () => [this.registration]);
}

let container: FakeContainer;

const originalEnv = process.env.NODE_ENV;

function setNodeEnv(value: string) {
  Object.defineProperty(process.env, "NODE_ENV", { value, configurable: true, writable: true });
}

beforeEach(() => {
  container = new FakeContainer();
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  setNodeEnv("production");
});

afterEach(() => {
  setNodeEnv(originalEnv ?? "test");
});

describe("useServiceWorker", () => {
  it("registers /sw.js for the whole site in production", async () => {
    renderHook(() => useServiceWorker());

    await waitFor(() =>
      expect(container.register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" }),
    );
  });

  it("does not register in development and removes a leftover worker", async () => {
    setNodeEnv("development");
    renderHook(() => useServiceWorker());

    await waitFor(() => expect(container.registration.unregister).toHaveBeenCalled());
    expect(container.register).not.toHaveBeenCalled();
  });

  it("does not offer an update on the first install", async () => {
    const { result } = renderHook(() => useServiceWorker());
    await waitFor(() => expect(container.register).toHaveBeenCalled());

    const worker = new FakeWorker();
    container.registration.installing = worker;
    act(() => container.registration.emit("updatefound"));
    act(() => {
      worker.state = "installed";
      worker.emit("statechange");
    });

    expect(result.current.isUpdateAvailable).toBe(false);
  });

  it("offers a waiting version and activates it only when asked", async () => {
    container.controller = {};
    const waiting = new FakeWorker();
    waiting.state = "installed";
    container.registration.waiting = waiting;

    const { result } = renderHook(() => useServiceWorker());
    await waitFor(() => expect(result.current.isUpdateAvailable).toBe(true));
    expect(waiting.postMessage).not.toHaveBeenCalled();

    act(() => result.current.applyUpdate());
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
