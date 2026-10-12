import type { MetadataRoute } from "next";
import { VISITOR_QR_PATH } from "@features/visitors/lib/visitors-links";
import { siteConfig } from "@shared/lib/site-config";

/** /robots.txt: todo el sitio es público salvo la API interna y los QR de los visitantes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", `${VISITOR_QR_PATH}/`] },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
