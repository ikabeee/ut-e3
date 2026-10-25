import type { Metadata } from "next";
import { siteConfig } from "@shared/lib/site-config";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

export function buildOpenGraph(overrides: Partial<OpenGraph> = {}): OpenGraph {
  // SAFETY: los valores base satisfacen la variante website de OpenGraph y se combinan con las sobreescrituras.
  return {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.title,
    images: [{ url: siteConfig.shareImage, alt: siteConfig.title }],
    ...overrides,
  } as OpenGraph;
}
