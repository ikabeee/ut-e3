"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { isNavLinkActive, NAV_LINKS } from "@features/site/lib/navigation";
import { ScrambleText } from "@shared/components/scramble-text";

export interface SiteNavLinksViewProps {
  pathname: string;
}

/** Vista de enlaces de navegación según la ruta activa. */
export function SiteNavLinksView({ pathname }: Readonly<SiteNavLinksViewProps>) {
  return (
    <ul className="m-0 scrollbar-none flex min-w-0 flex-1 list-none items-center gap-[clamp(14px,3vw,40px)] overflow-x-auto px-gutter font-nav text-[13px] leading-[1.3] font-medium tracking-[.02em] uppercase [font-variation-settings:'wdth'_87.5] max-[420px]:gap-3 max-[420px]:text-[11px] max-[400px]:gap-2">
      {NAV_LINKS.map((link) => {
        const isActive = isNavLinkActive(link, pathname);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "touch-target relative link-wipe whitespace-nowrap no-underline",
                isActive && "text-accent",
              )}
            >
              <ScrambleText text={link.label} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Enlaces de la navegación principal; el de la sección actual se marca en azul. */
export function SiteNavLinks() {
  const pathname = usePathname();

  return <SiteNavLinksView pathname={pathname} />;
}
