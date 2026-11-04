import { PixelMarquee } from "@features/studio/components/pixel-marquee";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_TOP_SECTION_ID } from "@features/studio/lib/studio-links";
import type { StudioLink } from "@features/studio/lib/types";
import { ActionLink } from "@shared/components/action-link";

const { closing } = STUDIO_COPY;

/** The blue band at the end: the "Hecho en el E3" ribbon and links to the rest of the site. */
export function StudioClosing({ links }: Readonly<{ links: StudioLink[] }>) {
  return (
    <section aria-label={closing.label} className="overflow-hidden bg-accent-deep py-[clamp(32px,5vw,72px)]">
      <div className="page-wrap">
        <a href={`#${STUDIO_TOP_SECTION_ID}`} className="touch-target relative link-wipe type-tiny no-underline">
          {closing.backToTop}
        </a>
      </div>
      <PixelMarquee
        text={closing.marquee}
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
