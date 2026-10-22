"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH } from "@features/landing/lib/landing-links";
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

  if (pathname === HOME_PATH) {
    return <LandingHeader pathname={pathname} />;
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
 * Variante clara de la portada (Figma 1:30): sin borde, sobre el fondo de la página, con la marca
 * (cubo + "UTGAMES") a la izquierda y los enlaces alineados a la derecha. Mide 141 px a 1512 px.
 */
function LandingHeader({ pathname }: Readonly<SiteHeaderViewProps>) {
  return (
    <nav
      aria-label={SITE_COPY.header.navigationLabel}
      data-theme="light"
      className="light sticky top-0 z-40 box-border flex h-[calc(env(safe-area-inset-top,0px)+clamp(64px,9.3vw,141px))] items-start gap-4 bg-background px-[clamp(16px,3.7vw,56px)] pt-[calc(env(safe-area-inset-top,0px)+clamp(12px,4.2vw,63px))] text-foreground"
    >
      <Link
        href={HOME_PATH}
        aria-label={SITE_COPY.header.homeLinkLabel}
        className="touch-target relative flex h-[39px] flex-none items-center gap-[12px]"
      >
        <LandingIcon name="logo-cube" className="h-[39px] w-[34px]" />
        <span aria-hidden="true" className="hidden text-[22px] leading-none font-bold sm:inline">
          {LANDING_COPY.header.brand}
        </span>
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
