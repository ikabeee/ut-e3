import type { ReactNode } from "react";
import { cn } from "@heroui/react";

interface AdminPanelProps {
  title: string;
  /** Texto bajo el título. */
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Bloque del panel con borde y título (un equipo, un juego, un formulario...). */
export function AdminPanel({ title, hint, children, className }: Readonly<AdminPanelProps>) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 border border-border p-[clamp(14px,2vw,22px)]", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="type-section">{title}</h2>
        {hint ? <p className="m-0 text-sm text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
