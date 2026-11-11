import type { ReactNode } from "react";
import { Card, cn } from "@heroui/react";

interface PaperCardProps {
  children: ReactNode;
  /** Relleno, separación y tamaños propios de cada uso. */
  className?: string;
}

/** Card de HeroUI con el panel claro del diseño (`.card-body`): fondo #F4F4F4 y texto negro. */
export function PaperCard({ children, className }: Readonly<PaperCardProps>) {
  return (
    <Card className={cn("flex-col rounded-none bg-paper text-paper-foreground shadow-none", className)}>{children}</Card>
  );
}
