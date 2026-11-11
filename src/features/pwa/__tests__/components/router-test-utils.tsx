import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";

// The App Router provides the router through this context; jest.mock is not allowed in this repository.
export function createRouter(refresh: () => void): AppRouterInstance {
  return {
    back: () => undefined,
    bfcacheId: "test",
    forward: () => undefined,
    prefetch: () => undefined,
    push: () => undefined,
    refresh,
    replace: () => undefined,
  };
}

export function withRouter(router: AppRouterInstance, children: ReactNode) {
  return <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>;
}

// jsdom always reports a network; the tests decide what the phone says and tell the page about the change.
export function setNetwork(isOnline: boolean) {
  jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(isOnline);
  window.dispatchEvent(new Event(isOnline ? "online" : "offline"));
}
