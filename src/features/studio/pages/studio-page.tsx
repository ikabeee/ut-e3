import type { Metadata } from "next";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { SiteFooter } from "@features/landing/components/site-footer";
import { SiteNav } from "@features/landing/components/site-nav";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { ContactSection } from "@features/studio/components/contact-section";
import { DisciplineStack } from "@features/studio/components/discipline-stack";
import { StudioClosing } from "@features/studio/components/studio-closing";
import { StudioHero } from "@features/studio/components/studio-hero";
import { StudioReel } from "@features/studio/components/studio-reel";
import { TestimonialBoard } from "@features/studio/components/testimonial-board";
import { WorkCarousel } from "@features/studio/components/work-carousel";
import { WorkSection } from "@features/studio/components/work-section";
import { sendContactMessage } from "@features/studio/lib/studio-actions";
import { CLOSING_LINKS, DISCIPLINES, TESTIMONIALS } from "@features/studio/lib/studio-content";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_PATH } from "@features/studio/lib/studio-links";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const { title, description } = STUDIO_COPY.page;

export const studioPageMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: STUDIO_PATH },
  openGraph: buildOpenGraph({ title: `${title} | ${siteConfig.title}`, description, url: STUDIO_PATH }),
};

export async function StudioPage() {
  return <StudioView games={await getGames()} />;
}

/** /studio: the showcase presented as a studio, in the style of a game agency site. */
export function StudioView({ games }: Readonly<{ games: Game[] }>) {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <StudioHero division={siteConfig.organization.division} />
      <main>
        <StudioReel />
        <DisciplineStack disciplines={DISCIPLINES} />
        <WorkSection>
          <WorkCarousel games={games} />
        </WorkSection>
        <TestimonialBoard testimonials={TESTIMONIALS} />
        <ContactSection action={sendContactMessage} />
      </main>
      <StudioClosing links={CLOSING_LINKS} />
      <SiteFooter />
    </>
  );
}
