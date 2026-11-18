import type { ReactNode } from "react";

interface CenteredPageProps {
  title: string;
  children: ReactNode;
}

/** The page of a single task of the staff access (a code, a reset): a title and its content, centered. */
export function CenteredPage({ title, children }: Readonly<CenteredPageProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-8 py-16">
      <h1 className="type-section">{title}</h1>
      {children}
    </main>
  );
}
