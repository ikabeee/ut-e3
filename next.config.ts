import type { NextConfig } from "next";

// Archivos de public/ que cambian poco (imágenes de la portada): caché de un día y revalidación en
// segundo plano. No llevan hash en el nombre, por eso no se marcan como inmutables.
const MEDIA_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    // AVIF primero (más ligero) y WebP como respaldo.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return ["/media/:path*", "/landing/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }],
    }));
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
