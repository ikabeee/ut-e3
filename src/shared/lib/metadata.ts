import type { Metadata } from "next";
import { siteConfig } from "@shared/lib/site-config";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

// The generated image of the site (src/app/opengraph-image.tsx): every page that shares itself without an image of its
// own uses it. Next does not merge the Open Graph of the layout, so each page has to name it again.
export const SITE_OG_IMAGE_PATH = "/opengraph-image";

// What Facebook, WhatsApp, LinkedIn and X draw best: the size and the type that every opengraph-image route declares.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const OG_IMAGE_CONTENT_TYPE = "image/png";

export function buildOpenGraph(overrides: Partial<OpenGraph> = {}): OpenGraph {
  // SAFETY: los valores base satisfacen la variante website de OpenGraph y se combinan con las sobreescrituras.
  return {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.title,
    images: [buildOgImage(SITE_OG_IMAGE_PATH, siteConfig.title)],
    ...overrides,
  } as OpenGraph;
}

export function buildOgImage(url: string, alt: string) {
  return { url, ...OG_IMAGE_SIZE, alt };
}
