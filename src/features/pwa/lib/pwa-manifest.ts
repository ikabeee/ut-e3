import type { MetadataRoute } from "next";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { siteConfig } from "@shared/lib/site-config";

// Replace the three PNG files of public/icons with the official logo (same names and sizes); the maskable one needs
// the logo inside the central 80 % so Android can crop it into a circle or a rounded square.
const ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

/** The web app manifest: the app opens on the passport, which sends who has none to the registration. */
export function buildManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: PASSPORT_PATH,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: siteConfig.backgroundColor,
    theme_color: siteConfig.themeColor,
    lang: "es",
    icons: ICONS,
  };
}
