import type { Metadata } from "next";
import { LandingPlaceholder } from "@features/landing/components/landing-placeholder";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const landingPageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph(),
};

/** Portada (`/`) provisional mientras se construye la versión 2 del sitio. */
export function LandingPage() {
  return <LandingPlaceholder organizationLabel={siteConfig.organizationLabel} />;
}
