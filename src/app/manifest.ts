import type { MetadataRoute } from "next";
import { routes, siteConfig } from "@shared/lib/site-config";

const shortcutIcon = { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" };

/**
 * Manifiesto web: nombre, colores, íconos y accesos directos de la app instalada.
 * Los PNG de `public/icons/` se generan desde `icon.svg` con `npm run pwa:icons`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "es-MX",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: siteConfig.themeColor,
    theme_color: siteConfig.themeColor,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Juegos", url: routes.games, icons: [shortcutIcon] },
      { name: "Croquis", url: routes.floorPlan, icons: [shortcutIcon] },
    ],
  };
}
