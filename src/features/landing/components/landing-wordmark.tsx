import { cn } from "@heroui/react";
import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

export type LandingWordmarkSize = "hero" | "section" | "card";

interface LandingWordmarkProps {
  size: LandingWordmarkSize;
  className?: string;
}

// Tamaño de letra medido sobre el Figma (1512 px de ancho): 141 px en la portada, 68 px en los juegos
// y 49 px en la rifa. Los iconos miden 0,93 em y los huecos 0,19 em; todo lo demás se mide en `em`.
const SIZES: Record<LandingWordmarkSize, string> = {
  hero: "text-[clamp(2.5rem,9.3vw,8.8rem)]",
  section: "text-[clamp(2rem,4.5vw,4.25rem)]",
  card: "text-[clamp(1.5rem,5.3vw,3.05rem)]",
};

const ICON = "size-[0.93em] shrink-0";

/** Logotipo "VIDE [+] JUEG [o] S" compartido por la portada, los juegos y la rifa. Se lee "Videojuegos". */
export function LandingWordmark({ size, className }: Readonly<LandingWordmarkProps>) {
  return (
    <span
      role="img"
      aria-label={LANDING_COPY.wordmark.label}
      className={cn(
        "inline-flex items-center gap-[0.19em] leading-none font-bold whitespace-nowrap",
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden="true">VIDE</span>
      <Image src="/landing/icons/wordmark-plus.svg" alt="" width={131} height={131} unoptimized className={ICON} />
      <span aria-hidden="true">JUEG</span>
      <Image src="/landing/icons/wordmark-face.svg" alt="" width={127} height={127} unoptimized className={ICON} />
      <span aria-hidden="true">S</span>
    </span>
  );
}
