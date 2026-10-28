import type { Metadata } from "next";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const privacyPageMetadata: Metadata = {
  title: VISITORS_COPY.privacy.title,
  description: VISITORS_COPY.privacy.pendingNotice,
  alternates: { canonical: PRIVACY_PATH },
  openGraph: buildOpenGraph({
    title: `${VISITORS_COPY.privacy.title} | ${siteConfig.title}`,
    description: VISITORS_COPY.privacy.pendingNotice,
    url: PRIVACY_PATH,
  }),
};

export function PrivacyPage() {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-6 py-16 text-center">
      <h1 className="type-section">{VISITORS_COPY.privacy.title}</h1>
      <p className="max-w-md text-muted">{VISITORS_COPY.privacy.pendingNotice}</p>
    </main>
  );
}
