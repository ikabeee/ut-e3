"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME_PATH } from "@features/home/lib/home-links";
import { SiteNavLinksView } from "@features/site/components/site-nav-links";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { UtgLogo } from "@shared/components/utg-logo";

/**
 * Barra de navegación fija con el logo y las secciones del sitio. El relleno `safe-area-inset-*`
 * extiende el fondo debajo de la barra de estado y del notch (el layout usa `viewportFit: "cover"`).
 * No se muestra en los paneles privados (administración y portal de equipos).
 */
export interface SiteHeaderViewProps {
  pathname: string;
}

export function SiteHeaderView({ pathname }: Readonly<SiteHeaderViewProps>) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/team")) {
    return null;
  }

  return (
    <nav
      aria-label={SITE_COPY.header.navigationLabel}
      className="sticky top-0 z-40 box-content flex h-nav items-stretch border-b border-separator bg-background pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]"
    >
      <Link
        href={HOME_PATH}
        aria-label={SITE_COPY.header.homeLinkLabel}
        className="group grid flex-none place-items-center border-r border-separator bg-background px-[18px]"
      >
        <UtgLogo
          variant="extruded"
          className="block h-[34px] w-auto transition-transform duration-[250ms] group-hover:translate-x-[-1px] group-hover:translate-y-[-2px]"
        />
      </Link>
      <SiteNavLinksView pathname={pathname} />
    </nav>
  );
}

/**
 * Barra de navegación fija con el logo y las secciones del sitio. El relleno `safe-area-inset-*`
 * extiende el fondo debajo de la barra de estado y del notch (el layout usa `viewportFit: "cover"`).
 * No se muestra en los paneles privados (administración y portal de equipos).
 */
export function SiteHeader() {
  const pathname = usePathname();

  return <SiteHeaderView pathname={pathname} />;
}
