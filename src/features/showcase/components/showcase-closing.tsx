import { PixelMarquee } from "@features/showcase/components/pixel-marquee";
import { SHOWCASE_COPY } from "@features/showcase/lib/showcase-copy";
import { SHOWCASE_TOP_SECTION_ID } from "@features/showcase/lib/showcase-links";
import type { ShowcaseLink } from "@features/showcase/lib/types";
import { ActionLink } from "@shared/components/action-link";

const { closing } = SHOWCASE_COPY;

interface ShowcaseClosingProps {
  /** The text of the LED ribbon. */
  marquee: string;
  links: ShowcaseLink[];
}

/** The blue band at the end: the LED ribbon and links to the rest of the site. */
export function ShowcaseClosing({ marquee, links }: Readonly<ShowcaseClosingProps>) {
  return (
    <section aria-label={closing.label} className="overflow-hidden bg-accent-deep py-[clamp(32px,5vw,72px)]">
      <div className="page-wrap">
        <a href={`#${SHOWCASE_TOP_SECTION_ID}`} className="touch-target relative link-wipe type-tiny no-underline">
          {closing.backToTop}
        </a>
      </div>
      <PixelMarquee
        text={marquee}
        className="my-[clamp(20px,3vw,40px)]"
        textClassName="h-[clamp(64px,13vw,200px)] fill-black"
      />
      <nav aria-label={closing.linksLabel} className="page-wrap">
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
          {links.map((link) => (
            <li key={link.href}>
              <ActionLink href={link.href} variant="outline" arrow="ne" className="min-h-11">
                {link.label}
              </ActionLink>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
