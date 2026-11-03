import type { NextConfig } from "next";

const MEDIA_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const WORKER_HEADERS = [
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Service-Worker-Allowed", value: "/" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // The Docker image runs the server that `next build` traces into .next/standalone (docs/deploy.md).
  output: "standalone",
  // Only the dev server reads this: it lets a phone on the local network (192.168.x.x) use the app while testing.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }] },
      // The browser must look for a new service worker (and its policy file) on every visit, or an old one lives on.
      { source: "/:file(sw|sw-policy).js", headers: WORKER_HEADERS },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
