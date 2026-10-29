import type { Metadata } from "next";
import { SiteNav } from "@features/landing/components/site-nav";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { SponsorCards } from "@features/sponsors/components/sponsor-cards";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { SPONSORS_PATH } from "@features/sponsors/lib/sponsors-links";
import { getSponsors } from "@features/sponsors/lib/server/sponsors-queries";
import type { Sponsor } from "@features/sponsors/lib/types";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const { pageTitle, pageDescription } = SPONSORS_COPY.page;

export const sponsorsPageMetadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: SPONSORS_PATH },
  openGraph: buildOpenGraph({
    title: `${pageTitle} | ${siteConfig.title}`,
    description: pageDescription,
    url: SPONSORS_PATH,
  }),
};

export async function SponsorsPage() {
  return <SponsorsView sponsors={await getSponsors()} />;
}

export function SponsorsView({ sponsors }: Readonly<{ sponsors: Sponsor[] }>) {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <main className="page-wrap pt-[clamp(40px,6vw,72px)] pb-[clamp(56px,8vw,112px)]">
        <h1 className="mb-[clamp(24px,4vw,48px)] type-wide text-[clamp(24px,7vw,104px)] leading-[.92] tracking-tighter">
          {pageTitle}
        </h1>
        <SponsorCards sponsors={sponsors} />
      </main>
    </>
  );
}
