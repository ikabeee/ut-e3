import type { NextConfig } from "next";

// Archivos de public/ que cambian poco (reel e imágenes): caché de un día y revalidación en
// segundo plano. No llevan hash en el nombre, por eso no se marcan como inmutables.
const MEDIA_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Reintenta navegaciones y Server Actions al volver la conexión y habilita `useOffline()`.
    useOffline: true,
  },
  images: {
    // AVIF primero (más ligero) y WebP como respaldo.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    const media = ["/media/:path*", "/mock/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }],
    }));
    // El service worker nunca se guarda en caché HTTP: así el navegador detecta cada versión nueva.
    const serviceWorker = {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    };
    return [...media, serviceWorker];
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
