"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { getNavLinks, isNavLinkActive } from "@features/site/lib/navigation";
import { ScrambleText } from "@shared/components/scramble-text";

export interface SiteNavLinksViewProps {
  pathname: string;
}

const DARK_LIST =
  "m-0 scrollbar-none flex min-w-0 flex-1 list-none items-center gap-[clamp(14px,3vw,40px)] overflow-x-auto px-gutter font-nav text-[13px] leading-[1.3] font-medium tracking-[.02em] uppercase [font-variation-settings:'wdth'_87.5] max-[420px]:gap-3 max-[420px]:text-[11px] max-[400px]:gap-2";

// Figma 1:38: LINE Seed JP regular de 20 px (#0D0D0D), alineados a la derecha con 39 px entre enlaces.
const LANDING_LIST =
  "m-0 scrollbar-none flex h-[39px] min-w-0 flex-1 list-none items-center justify-end-safe gap-[clamp(14px,2.6vw,39px)] overflow-x-auto font-nav text-[clamp(13px,1.19vw,18px)] leading-[1.3] font-normal text-landing-band uppercase max-[420px]:gap-3 max-[420px]:text-[12px]";

/** Vista de enlaces de navegación según la ruta activa. */
export function SiteNavLinksView({ pathname }: Readonly<SiteNavLinksViewProps>) {
  return (
    <ul className={pathname === HOME_PATH ? LANDING_LIST : DARK_LIST}>
      {getNavLinks(pathname).map((link) => {
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
