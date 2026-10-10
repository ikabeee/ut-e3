import type { MetadataRoute } from "next";
import { siteConfig } from "@shared/lib/site-config";

/** /robots.txt: todo el sitio es público salvo la API interna. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
