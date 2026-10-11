import { buildServiceWorkerScript } from "@features/offline/lib/service-worker-script";

describe("buildServiceWorkerScript", () => {
  it("runs the worker with the injected configuration and its pure helpers", () => {
    const script = buildServiceWorkerScript({
      version: "build-42",
      cachePrefix: "ut-e3",
      precacheUrls: ["/", "/offline"],
      offlineUrl: "/offline",
      networkTimeoutMs: 3000,
      maxImageEntries: 60,
      skipWaitingMessage: "SKIP_WAITING",
    });

    expect(script.startsWith('"use strict";')).toBe(true);
    expect(script).toContain('"version":"build-42"');
    expect(script).toContain('"precacheUrls":["/","/offline"]');
    expect(script).toContain("getRequestStrategy:");
    expect(script).toContain("extractStaticAssetUrls:");
    expect(script).not.toMatch(/\bimport\b|\brequire\(/);
  });
});
