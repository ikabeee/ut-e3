import Link from "next/link";
import { SiteNavLinks } from "@shared/components/site-nav-links";
import { UtgLogo } from "@shared/components/utg-logo";
import { routes } from "@shared/lib/site-config";

/** Barra de navegación fija con el logo y las secciones del sitio. */
export function SiteHeader() {
  return (
    <nav
      aria-label="Principal"
      className="sticky top-[env(safe-area-inset-top,0px)] z-40 flex h-nav items-stretch border-b border-separator bg-background"
    >
      <Link
        href={routes.home}
        aria-label="UTG, inicio"
        className="group grid flex-none place-items-center border-r border-separator bg-background px-[18px]"
      >
        <UtgLogo
          variant="extruded"
          className="block h-[34px] w-auto transition-transform duration-[250ms] group-hover:translate-x-[-1px] group-hover:translate-y-[-2px]"
        />
      </Link>
      <SiteNavLinks />
    </nav>
  );
}
