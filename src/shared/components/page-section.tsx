import type { ReactNode } from "react";
import { Container } from "./container";

interface PageSectionProps {
  title: string;
  children: ReactNode;
}

export function PageSection({ title, children }: PageSectionProps) {
  return (
    <Container>
      <section className="flex flex-col gap-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {children}
      </section>
    </Container>
  );
}
