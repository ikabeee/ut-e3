import Link from "next/link";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { UtgLogo } from "@shared/components/utg-logo";

interface NavLink {
  href: string;
  label: string;
}

interface SiteNavProps {
  homeHref: string;
  links: NavLink[];
}

export function SiteNav({ homeHref, links }: Readonly<SiteNavProps>) {
  return (
    <nav
      aria-label={LANDING_COPY.nav.label}
      className="sticky top-0 z-40 box-content flex h-nav items-stretch border-b border-separator bg-background pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]"
    >
      <HomeLink href={homeHref} />
      <NavLinkList links={links} />
    </nav>
  );
}

function HomeLink({ href }: Readonly<{ href: string }>) {
  return (
    <Link
      href={href}
      aria-label={LANDING_COPY.nav.homeLabel}
      className="group relative grid flex-none place-items-center border-r border-separator bg-background px-[18px]"
    >
      <UtgLogo
        variant="extruded"
        className="block h-[34px] w-auto transition-transform duration-250 group-hover:-translate-x-px group-hover:translate-y-[-2px]"
      />
    </Link>
  );
}

function NavLinkList({ links }: Readonly<Pick<SiteNavProps, "links">>) {
  return (
    <ul className="m-0 scrollbar-none flex min-w-0 flex-1 list-none items-center gap-[clamp(14px,3vw,40px)] overflow-x-auto px-gutter font-nav text-[13px] leading-[1.3] font-medium tracking-[.02em] uppercase [font-variation-settings:'wdth'_87.5] max-[420px]:gap-3 max-[420px]:text-[11px]">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="touch-target relative link-wipe whitespace-nowrap no-underline">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
