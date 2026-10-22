"use client";

import { usePathname } from "next/navigation";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { siteConfig } from "@shared/lib/site-config";

/** Pie del sitio: nombre del showcase y organización. No se muestra en la portada ni en paneles privados. */
export interface SiteFooterViewProps {
  pathname: string;
}

export function SiteFooterView({ pathname }: Readonly<SiteFooterViewProps>) {
  if (pathname === HOME_PATH || pathname.startsWith("/admin") || pathname.startsWith("/team")) {
    return null;
  }

  return (
    <footer>
      <div className="page-wrap flex flex-wrap justify-between gap-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] type-tiny">
        <span className="text-accent">{siteConfig.title}</span>
        <span className="text-muted">{siteConfig.organizationLabel}</span>
      </div>
    </footer>
  );
}

/** Pie del sitio: nombre del showcase y organización. No se muestra en paneles privados. */
export function SiteFooter() {
  const pathname = usePathname();

  return <SiteFooterView pathname={pathname} />;
}
