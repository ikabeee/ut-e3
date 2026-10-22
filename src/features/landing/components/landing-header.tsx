import Link from "next/link";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import {
  HOME_PATH,
  LANDING_DYNAMICS_HREF,
  LANDING_GAMES_HREF,
  LANDING_PROGRAM_HREF,
} from "@features/landing/lib/landing-links";

const { header } = LANDING_COPY;

const NAV_LINKS = [
  { href: HOME_PATH, label: header.links.home },
  { href: LANDING_GAMES_HREF, label: header.links.games },
  { href: LANDING_DYNAMICS_HREF, label: header.links.dynamics },
  { href: LANDING_PROGRAM_HREF, label: header.links.program },
] as const;

// Figma 1:38: LINE Seed JP regular de 20 px (#0D0D0D), alineados a la derecha con 39 px entre enlaces.
const LIST =
  "m-0 scrollbar-none flex h-[39px] min-w-0 flex-1 list-none items-center justify-end-safe gap-[clamp(14px,2.6vw,39px)] overflow-x-auto font-nav text-[clamp(13px,1.19vw,18px)] leading-[1.3] font-normal text-landing-band uppercase max-[420px]:gap-3 max-[420px]:text-[12px]";

// Sin glitch: el color coral y un subrayado que crece de izquierda a derecha, al pasar el mouse o con foco de teclado.
const LINK =
  "touch-target relative whitespace-nowrap no-underline transition-colors duration-300 ease-out after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:text-landing-coral-light hover:after:scale-x-100 focus-visible:text-landing-coral-light focus-visible:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none";

/**
 * Barra fija de la portada (Figma 1:30): marca (cubo + "UTGAMES") a la izquierda y las anclas de
 * las secciones a la derecha. Mide 141 px a 1512 px. El relleno `safe-area-inset-*` extiende el
 * fondo debajo de la barra de estado y del notch (el layout usa `viewportFit: "cover"`).
 */
export function LandingHeader() {
  return (
    <nav
      aria-label={header.navigationLabel}
      className="sticky top-0 z-40 box-border flex h-[calc(env(safe-area-inset-top,0px)+clamp(64px,9.3vw,141px))] items-start gap-4 bg-background px-[clamp(16px,3.7vw,56px)] pt-[calc(env(safe-area-inset-top,0px)+clamp(12px,4.2vw,63px))] text-foreground"
    >
      <Link
        href={HOME_PATH}
        aria-label={header.homeLinkLabel}
        className="touch-target relative flex h-[39px] flex-none items-center gap-[12px]"
      >
        <LandingIcon name="logo-cube" className="h-[39px] w-[34px]" />
        <span aria-hidden="true" className="hidden text-[22px] leading-none font-bold sm:inline">
          {header.brand}
        </span>
      </Link>
      <ul className={LIST}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
