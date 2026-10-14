"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SECTION_PATHS, type AdminSection } from "@features/admin/lib/admin-links";
import { ActionButton } from "@shared/components/action-button";
import { UtgLogo } from "@shared/components/utg-logo";
import type { ActionResult } from "@shared/lib/action-result";

// SAFETY: Las llaves de ADMIN_SECTION_PATHS son exactamente las secciones de AdminSection.
const SECTIONS = Object.keys(ADMIN_SECTION_PATHS) as AdminSection[];

const SECTION_ICONS: Record<AdminSection, ReactNode> = {
  home: (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  teams: (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  games: (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
      />
    </svg>
  ),
  catalog: (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
  raffle: (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  ),
};

const LOGOUT_ICON = (
  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

interface AdminShellProps {
  current: AdminSection;
  children: ReactNode;
  onLogout?: () => Promise<ActionResult<{ redirectTo: string }>>;
}

/** Marco del panel de administración: barra lateral (sidebar) y contenido principal. */
export function AdminShell({ current, children, onLogout }: Readonly<AdminShellProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (!onLogout) return;

    startTransition(async () => {
      const res = await onLogout();

      if (res.ok) {
        window.location.href = res.data.redirectTo;
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Barra superior para móviles */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href={ADMIN_SECTION_PATHS.home} className="flex items-center gap-2.5 no-underline">
          <UtgLogo variant="extruded" className="h-6 w-auto" />
          <span className="font-wide text-xs font-bold tracking-tight text-foreground uppercase">
            {ADMIN_COPY.title}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded border border-border text-foreground hover:bg-surface"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Menú desplegable para móviles */}
      {isMobileMenuOpen ? (
        <div className="sticky top-[53px] z-30 flex flex-col gap-2 border-b border-border bg-surface/95 p-4 backdrop-blur-md md:hidden">
          <nav aria-label={ADMIN_COPY.nav.label} className="flex flex-col gap-1">
            {SECTIONS.map((section) => {
              const isActive = section === current;

              return (
                <Link
                  key={section}
                  href={ADMIN_SECTION_PATHS[section]}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2.5 font-mono text-xs tracking-wider uppercase transition-colors",
                    isActive
                      ? "bg-accent font-bold text-background"
                      : "text-muted hover:bg-surface hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true">{SECTION_ICONS[section]}</span>
                  <span>{ADMIN_COPY.nav.sections[section]}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 border-t border-border pt-3">
            <ActionButton
              variant="secondary"
              size="sm"
              icon={LOGOUT_ICON}
              onPress={handleLogout}
              isPending={isPending}
              className="w-full"
            >
              {ADMIN_COPY.nav.logout}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {/* Barra lateral para pantallas de escritorio (Sidebar) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-surface/40 p-6 md:sticky md:top-0 md:flex md:h-screen lg:w-72">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 border-b border-border pb-6">
            <Link href={ADMIN_SECTION_PATHS.home} className="group flex items-center gap-3 no-underline">
              <UtgLogo
                variant="extruded"
                className="h-8 w-auto transition-transform group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]"
              />
            </Link>
            <div>
              <span className="block type-tiny tracking-wider text-muted uppercase">{ADMIN_COPY.kicker}</span>
              <h2 className="font-wide text-sm font-bold tracking-tight text-foreground uppercase">
                {ADMIN_COPY.title}
              </h2>
            </div>
          </div>

          <nav aria-label={ADMIN_COPY.nav.label} className="flex flex-col gap-1.5">
            {SECTIONS.map((section) => {
              const isActive = section === current;

              return (
                <Link
                  key={section}
                  href={ADMIN_SECTION_PATHS[section]}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded px-3.5 py-2.5 font-mono text-xs tracking-wider uppercase transition-all",
                    isActive
                      ? "bg-accent font-bold text-background shadow-sm"
                      : "text-muted hover:bg-surface hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true">{SECTION_ICONS[section]}</span>
                  <span>{ADMIN_COPY.nav.sections[section]}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Acciones inferiores del sidebar */}
        <div className="border-t border-border pt-4">
          <ActionButton
            variant="secondary"
            size="sm"
            icon={LOGOUT_ICON}
            onPress={handleLogout}
            isPending={isPending}
            className="w-full"
          >
            {ADMIN_COPY.nav.logout}
          </ActionButton>
        </div>
      </aside>

      {/* Área de contenido principal */}
      <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-1 border-b border-border pb-4">
            <span className="type-tiny tracking-wider text-muted uppercase">
              {ADMIN_COPY.title} · {ADMIN_COPY.kicker}
            </span>
            <h1 className="font-wide text-2xl font-bold tracking-tight text-foreground uppercase md:text-3xl">
              {ADMIN_COPY.nav.sections[current]}
            </h1>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
