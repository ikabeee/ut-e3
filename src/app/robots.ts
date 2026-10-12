import type { MetadataRoute } from "next";
import { ADMIN_PATH } from "@features/admin/lib/admin-links";
import { VISITOR_QR_PATH } from "@features/visitors/lib/visitors-links";
import { siteConfig } from "@shared/lib/site-config";

/** /robots.txt: todo el sitio es público salvo la API interna, los QR de los visitantes y el panel. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", `${VISITOR_QR_PATH}/`, ADMIN_PATH] },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
