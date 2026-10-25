import type { NextConfig } from "next";

const MEDIA_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/media/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }] }];
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
