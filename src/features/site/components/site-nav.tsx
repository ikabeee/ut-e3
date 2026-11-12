import { cn } from "@heroui/react";
import Link from "next/link";
import { SiteNavMenu } from "@features/site/components/site-nav-menu";
import { SITE_COPY } from "@features/site/lib/site-copy";
import {
  getCurrentNavHref,
  getSiteNavigation,
  isSiteNavShown,
  type SiteNavLink,
} from "@features/site/lib/site-navigation";
import { UtgLogo } from "@shared/components/utg-logo";

interface SiteNavProps {
  pathname: string;
  /** Only the landing is published (SITE_MODE=landing): the entries are anchors of the landing and there is no menu. */
  isLandingOnly?: boolean;
}

/** The navbar of every public page, mounted once by the root layout (SiteNavbar). */
export function SiteNav({ pathname, isLandingOnly = false }: Readonly<SiteNavProps>) {
  if (!isSiteNavShown(pathname)) return null;

  const { homeHref, links, cta } = getSiteNavigation(isLandingOnly);
  const currentHref = getCurrentNavHref(pathname, getNavHrefs(links, cta));

  return (
    <nav
      aria-label={SITE_COPY.nav.label}
      className="sticky top-0 z-40 box-content flex h-nav items-stretch border-b border-separator bg-background pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]"
    >
      <HomeLink href={homeHref} />
      <NavLinkList links={links} currentHref={currentHref} hasMenu={!isLandingOnly} />
      {cta && <NavCta link={cta} isCurrent={cta.href === currentHref} />}
      {isLandingOnly ? null : <SiteNavMenu links={links} currentHref={currentHref} />}
    </nav>
  );
}

function getNavHrefs(links: SiteNavLink[], cta?: SiteNavLink) {
  return [...links, ...(cta ? [cta] : [])].map((link) => link.href);
}

function HomeLink({ href }: Readonly<{ href: string }>) {
  return (
    <Link
      href={href}
      aria-label={SITE_COPY.nav.homeLabel}
      className="group relative grid flex-none place-items-center border-r border-separator bg-background px-[18px] max-[420px]:px-3"
    >
      <UtgLogo
        variant="extruded"
        className="block h-[34px] w-auto transition-transform duration-250 group-hover:-translate-x-px group-hover:translate-y-[-2px]"
      />
    </Link>
  );
}

interface NavLinkListProps {
  links: SiteNavLink[];
  currentHref?: string;
  /** The six entries of the app do not fit below 1024 px: there they move to the menu (SiteNavMenu). */
  hasMenu: boolean;
}

// The three landing-only entries fit a 360 px phone: below 420 px they shrink, and the list scrolls sideways and fades
// at the right edge if a narrower screen still cuts them.
function NavLinkList({ links, currentHref, hasMenu }: Readonly<NavLinkListProps>) {
  return (
    <ul
      className={cn(
        "m-0 scrollbar-none flex min-w-0 flex-1 list-none items-center gap-[clamp(14px,3vw,40px)] overflow-x-auto px-gutter font-nav text-[13px] leading-[1.3] font-medium tracking-[.02em] uppercase [font-variation-settings:'wdth'_87.5] max-[420px]:gap-3 max-[420px]:mask-r-from-75% max-[420px]:px-3 max-[420px]:text-[11px]",
        hasMenu && "max-lg:hidden",
      )}
    >
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            aria-current={link.href === currentHref ? "page" : undefined}
            className="touch-target relative link-wipe whitespace-nowrap no-underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NavCta({ link, isCurrent }: Readonly<{ link: SiteNavLink; isCurrent: boolean }>) {
  return (
    <Link
      href={link.href}
      aria-current={isCurrent ? "page" : undefined}
      className="touch-target relative ml-auto flex flex-none items-center bg-accent px-4 font-nav text-[11px] leading-[1.3] font-bold tracking-[.02em] whitespace-nowrap text-background uppercase no-underline sm:px-6 sm:text-[13px]"
    >
      {link.label}
    </Link>
  );
}
