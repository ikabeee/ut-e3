import type { MetadataRoute } from "next";
import { siteConfig } from "@shared/lib/site-config";

/** Manifiesto web: nombre, colores e icono al agregar el sitio a la pantalla de inicio. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
