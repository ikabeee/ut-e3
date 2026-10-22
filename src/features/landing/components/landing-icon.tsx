import { cn } from "@heroui/react";

export type LandingIconName =
  "arrow-up-right" | "calendar" | "carousel-next" | "carousel-previous" | "gamepad" | "logo-cube";

interface LandingIconProps {
  name: LandingIconName;
  /** Tamaño y color: el icono toma `currentColor`. */
  className?: string;
}

/**
 * Icono monocromo de `public/landing/icons/`. Se pinta como máscara sobre `currentColor`, así los
 * tokens del tema lo colorean (un `<img>` no puede).
 */
export function LandingIcon({ name, className }: Readonly<LandingIconProps>) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current mask-contain mask-center mask-no-repeat", className)}
      style={{ maskImage: `url(/landing/icons/${name}.svg)` }}
    />
  );
}
