import type { ReactNode } from "react";

interface GameDetailSectionProps {
  title: string;
  children: ReactNode;
}

/** Sección con línea superior y título (`.jg-about`). */
export function GameDetailSection({ title, children }: Readonly<GameDetailSectionProps>) {
  return (
    <section className="flex flex-col gap-[14px] border-t border-border pt-6">
      <h2 className="type-section">{title}</h2>
      {children}
    </section>
  );
}
