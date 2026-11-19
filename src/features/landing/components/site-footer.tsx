import Link from "next/link";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { FooterLinkGroup } from "@features/landing/lib/types";
import { siteConfig } from "@shared/lib/site-config";

const LINK_CLASS =
  "inline-flex min-h-8 items-center text-muted no-underline transition-colors hover:text-accent hover:underline focus-visible:text-accent focus-visible:underline active:text-foreground pointer-coarse:min-h-11";

interface SiteFooterProps {
  /** The site map: the links of each group. Without it only the credits are shown. */
  sitemap?: readonly FooterLinkGroup[];
}

export function SiteFooter({ sitemap }: Readonly<SiteFooterProps>) {
  const { footer } = LANDING_COPY;

  return (
    <footer>
      {sitemap && sitemap.length > 0 ? <FooterSitemap groups={sitemap} /> : null}
      <div className="page-wrap flex flex-wrap justify-between gap-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] type-tiny">
        <span className="text-accent">{siteConfig.title}</span>
        <span className="text-muted">{siteConfig.organizationLabel}</span>
        <p className="m-0 basis-full text-center text-muted">
          {footer.credit}{" "}
          <a
            href={footer.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target relative text-muted underline underline-offset-2 transition-colors hover:text-accent focus-visible:text-accent active:text-foreground"
          >
            {footer.creditName}
          </a>
        </p>
      </div>
    </footer>
  );
}

function FooterSitemap({ groups }: Readonly<{ groups: readonly FooterLinkGroup[] }>) {
  return (
    <nav aria-label={LANDING_COPY.footer.sitemap.label} className="border-t border-border pt-8">
      <div className="page-wrap grid grid-cols-2 gap-x-gutter gap-y-8 min-[820px]:grid-cols-3">
        {groups.map((group) => (
          <div key={group.id}>
            <p id={`footer-${group.id}`} className="m-0 mb-2 type-tiny text-accent">
              {group.label}
            </p>
            <ul aria-labelledby={`footer-${group.id}`} className="m-0 flex list-none flex-col p-0 type-tiny">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <ContactGroup />
      </div>
    </nav>
  );
}

function ContactGroup() {
  const { groups } = LANDING_COPY.footer.sitemap;

  return (
    <div className="min-w-0">
      <p id="footer-contact" className="m-0 mb-2 type-tiny text-accent">
        {groups.contact}
      </p>
      <ul aria-labelledby="footer-contact" className="m-0 flex list-none flex-col p-0 type-tiny">
        <li>
          <a href={`mailto:${siteConfig.contactEmail}`} className={`${LINK_CLASS} wrap-anywhere`}>
            {siteConfig.contactEmail}
          </a>
        </li>
      </ul>
    </div>
  );
}
