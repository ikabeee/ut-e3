import type { Metadata } from "next";
import { siteConfig } from "@shared/lib/site-config";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Open Graph de una página con los valores del sitio. Next.js reemplaza (no fusiona) el
 * `openGraph` del layout cuando una página define el suyo, así que se completan aquí.
 */
export function buildOpenGraph(overrides: Partial<OpenGraph> = {}): OpenGraph {
  return {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.title,
    images: [{ url: siteConfig.shareImage, alt: siteConfig.title }],
    ...overrides,
  } as OpenGraph;
}
