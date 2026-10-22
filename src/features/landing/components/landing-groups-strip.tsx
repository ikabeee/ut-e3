import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingGroupsStripProps {
  groups: readonly string[];
}

/**
 * Banda negra a todo el ancho (Figma 1:16, 92 px) que se encima 77 px sobre el final de la imagen de la
 * portada. Los grupos van en los extremos y el centro, unidos por filetes de 1 px (Figma 1:81 y 1:82).
 */
export function LandingGroupsStrip({ groups }: Readonly<LandingGroupsStripProps>) {
  return (
    <ul
      aria-label={LANDING_COPY.groups.ariaLabel}
      className="relative z-10 -mt-12 flex h-16 items-center justify-between gap-[clamp(12px,2.6vw,40px)] bg-foreground pr-[clamp(16px,7vw,107px)] pl-[clamp(16px,5.2vw,78px)] text-[clamp(1rem,1.7vw,1.625rem)] text-background/77 md:-mt-[77px] md:h-[92px]"
    >
      {groups.map((group, index) => (
        <li key={group} className="flex items-center gap-[clamp(12px,2.6vw,40px)] whitespace-nowrap md:not-last:flex-1">
          {group}
          {index < groups.length - 1 && (
            <span aria-hidden="true" className="hidden h-px flex-1 bg-background/30 md:block" />
          )}
        </li>
      ))}
    </ul>
  );
}
