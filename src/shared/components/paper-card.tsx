import type { ReactNode } from "react";
import { Card, cn } from "@heroui/react";

interface PaperCardProps {
  children: ReactNode;
  className?: string;
}

export function PaperCard({ children, className }: Readonly<PaperCardProps>) {
  return (
    <Card className={cn("flex-col rounded-none bg-paper text-paper-foreground shadow-none", className)}>
      {children}
    </Card>
  );
}
