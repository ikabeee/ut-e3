import type { ReactNode } from "react";

interface PassportSectionProps {
  title: string;
  children: ReactNode;
}

/** Sección del pasaporte con línea superior y título, como las del detalle de un juego. */
export function PassportSection({ title, children }: Readonly<PassportSectionProps>) {
  return (
    <section className="flex flex-col gap-[14px] border-t border-border pt-6">
      <h2 className="type-section">{title}</h2>
      {children}
    </section>
  );
}
