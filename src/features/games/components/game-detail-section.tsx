import type { ReactNode } from "react";

/** Título de sección del detalle (`.jg-h2`). */
export const GAME_SECTION_HEADING_CLASS =
  "font-wide text-[clamp(18px,1.8vw,24px)] leading-none font-bold tracking-[-.02em] uppercase";

interface GameDetailSectionProps {
  title: string;
  children: ReactNode;
}

/** Sección con línea superior y título (`.jg-about`). */
export function GameDetailSection({ title, children }: Readonly<GameDetailSectionProps>) {
  return (
    <section className="flex flex-col gap-[14px] border-t border-border pt-6">
      <h2 className={GAME_SECTION_HEADING_CLASS}>{title}</h2>
      {children}
    </section>
  );
}
