"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { ScrambleText } from "@shared/components/scramble-text";
import { routes } from "@shared/lib/site-config";

interface NavLink {
  href: string;
  label: string;
  /** Prefijo de ruta que marca el enlace como página actual. */
  activePrefix?: string;
}

// "Inicio" no se resalta: en el diseño sólo se marcan las secciones internas.
const NAV_LINKS: readonly NavLink[] = [
  { href: routes.home, label: "Inicio" },
  { href: routes.games, label: "Juegos", activePrefix: routes.games },
  { href: routes.floorPlan, label: "Croquis", activePrefix: routes.floorPlan },
];

export function isNavLinkActive(link: NavLink, pathname: string) {
  return link.activePrefix !== undefined && pathname.startsWith(link.activePrefix);
}

export function SiteNavLinks() {
  const pathname = usePathname();

  return (
    <ul className="scrollbar-none m-0 flex min-w-0 flex-1 list-none items-center gap-[clamp(14px,3vw,40px)] overflow-x-auto px-gutter font-nav text-[13px] leading-[1.3] font-medium tracking-[.02em] uppercase [font-variation-settings:'wdth'_87.5] max-[420px]:gap-3 max-[420px]:text-[11px]">
      {NAV_LINKS.map((link) => {
        const isActive = isNavLinkActive(link, pathname);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn("link-wipe whitespace-nowrap no-underline", isActive && "text-accent")}
            >
              <ScrambleText text={link.label} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
