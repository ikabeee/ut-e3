import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SECTION_PATHS, type AdminSection } from "@features/admin/lib/admin-links";

const SECTIONS = Object.keys(ADMIN_SECTION_PATHS) as AdminSection[];

interface AdminShellProps {
  current: AdminSection;
  children: ReactNode;
}

/** Marco de las páginas del panel: título y pestañas de las secciones. */
export function AdminShell({ current, children }: Readonly<AdminShellProps>) {
  return (
    <main className="pt-[clamp(28px,4vw,48px)]">
      <div className="page-wrap flex flex-col gap-[clamp(20px,3vw,32px)]">
        <header className="flex flex-col gap-2">
          <span className="type-tiny text-muted">{ADMIN_COPY.kicker}</span>
          <h1 className="font-wide text-[clamp(26px,4vw,48px)] leading-[.95] font-bold tracking-[-.035em] uppercase">
            {ADMIN_COPY.title}
          </h1>
        </header>
        <nav aria-label={ADMIN_COPY.nav.label} className="scrollbar-none overflow-x-auto border-b border-border">
          <ul className="m-0 flex list-none gap-5 p-0 type-tiny">
            {SECTIONS.map((section) => (
              <li key={section}>
                <Link
                  href={ADMIN_SECTION_PATHS[section]}
                  aria-current={section === current ? "page" : undefined}
                  className={cn(
                    "-mb-px flex min-h-11 items-center border-b-2 border-transparent whitespace-nowrap no-underline hover:text-accent",
                    section === current && "border-accent text-accent",
                  )}
                >
                  {ADMIN_COPY.nav.sections[section]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </div>
    </main>
  );
}
