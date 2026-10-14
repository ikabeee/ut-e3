"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@heroui/react";
import { TeamGameManager } from "@features/teams/components/team-game-manager";
import { TeamMemberManager } from "@features/teams/components/team-member-manager";
import { TeamScanner } from "@features/teams/components/team-scanner";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalData } from "@features/teams/lib/types";
import { getTrafficLevel, type TrafficLevel } from "@features/visitors/lib/stand-traffic";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { UtgLogo } from "@shared/components/utg-logo";
import { useUrlHash } from "@shared/hooks/use-url-hash";
import type { ActionResult } from "@shared/lib/action-result";

const LEVEL_COLOR: Record<TrafficLevel, string> = {
  low: "bg-success text-success-foreground",
  medium: "bg-warning text-warning-foreground",
  high: "bg-danger text-danger-foreground",
};

export type TeamSection = "overview" | "scanner" | "members" | "game";

interface SectionConfig {
  id: TeamSection;
  label: string;
  description: string;
  icon: ReactNode;
}

const SECTIONS: readonly SectionConfig[] = [
  {
    id: "overview",
    label: TEAMS_COPY.sections.overview.label,
    description: TEAMS_COPY.sections.overview.description,
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: "scanner",
    label: TEAMS_COPY.sections.scanner.label,
    description: TEAMS_COPY.sections.scanner.description,
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        />
      </svg>
    ),
  },
  {
    id: "members",
    label: TEAMS_COPY.sections.members.label,
    description: TEAMS_COPY.sections.members.description,
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "game",
    label: TEAMS_COPY.sections.game.label,
    description: TEAMS_COPY.sections.game.description,
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      </svg>
    ),
  },
];

const LOGOUT_ICON = (
  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

interface TeamPortalViewProps {
  data: TeamPortalData;
  onLogout?: () => Promise<ActionResult<{ redirectTo: string }>>;
}

function resolveSection(hash: string): TeamSection {
  if (hash === "scanner" || hash === "escaner") return "scanner";

  if (hash === "members" || hash === "integrantes") return "members";

  if (hash === "game" || hash === "juego") return "game";

  return "overview";
}

export function TeamPortalView({ data, onLogout }: Readonly<TeamPortalViewProps>) {
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hash, setHash] = useUrlHash();

  const activeSection = resolveSection(hash);
  const trafficLevel = getTrafficLevel(data.recentCheckIns);

  const handleSelectSection = (section: TeamSection) => {
    setHash(section === "overview" ? "" : section);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (!onLogout) return;

    startTransition(async () => {
      const res = await onLogout();

      if (res.ok) {
        window.location.href = res.data.redirectTo;
      }
    });
  };

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  const copy = TEAMS_COPY;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Barra superior móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <UtgLogo variant="extruded" className="h-6 w-auto" />
          <div className="flex flex-col">
            <span className="font-wide text-xs font-bold tracking-tight text-foreground uppercase">{data.name}</span>
            <span className="type-tiny text-accent">
              {data.standCode ? copy.portal.stand(data.standCode) : copy.portal.stand(copy.portal.standUnassigned)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded border border-border text-foreground hover:bg-surface"
          aria-label={isMobileMenuOpen ? copy.portal.ariaCloseMenu : copy.portal.ariaOpenMenu}
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
          <nav aria-label={copy.portal.ariaNav} className="flex flex-col gap-1">
            {SECTIONS.map((section) => {
              const isActive = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSelectSection(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2.5 text-left font-mono text-xs tracking-wider uppercase transition-colors",
                    isActive
                      ? "bg-accent font-bold text-background"
                      : "text-muted hover:bg-surface hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
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
              {copy.portal.logout}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {/* Barra lateral para pantallas de escritorio (Sidebar) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-surface/40 p-6 md:sticky md:top-0 md:flex md:h-screen lg:w-72">
        <div className="flex flex-col gap-8">
          {/* Cabecera del equipo y stand */}
          <div className="flex flex-col gap-3 border-b border-border pb-6">
            <Link href="/team" className="group flex items-center gap-3 no-underline">
              <UtgLogo
                variant="extruded"
                className="h-8 w-auto transition-transform group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]"
              />
            </Link>
            <div>
              <span className="block type-tiny tracking-wider text-muted uppercase">{copy.portal.header}</span>
              <h2 className="font-wide text-base font-bold tracking-tight text-foreground uppercase">{data.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                {data.standCode ? (
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold tracking-wider text-accent uppercase">
                    {copy.portal.stand(data.standCode)}
                  </span>
                ) : (
                  <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                    {copy.portal.standPending}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navegación por secciones */}
          <nav aria-label={copy.portal.ariaNav} className="flex flex-col gap-1.5">
            {SECTIONS.map((section) => {
              const isActive = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSelectSection(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded px-3.5 py-2.5 text-left font-mono text-xs tracking-wider uppercase transition-all",
                    isActive
                      ? "bg-accent font-bold text-background shadow-sm"
                      : "text-muted hover:bg-surface hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
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
            {copy.portal.logout}
          </ActionButton>
        </div>
      </aside>

      {/* Área de contenido principal según la sección activa */}
      <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <header className="flex flex-col gap-1 border-b border-border pb-4">
            <span className="type-tiny tracking-wider text-muted uppercase">{copy.portal.portalTeam(data.name)}</span>
            <h1 className="font-wide text-2xl font-bold tracking-tight text-foreground uppercase md:text-3xl">
              {currentSection.label}
            </h1>
            <p className="m-0 text-xs text-muted">{currentSection.description}</p>
          </header>

          {/* Sección 1: Resumen y Métricas */}
          {activeSection === "overview" && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PaperCard className="p-6">
                  <p className="text-xs font-bold tracking-wider text-paper-foreground/70 uppercase">
                    {copy.overview.totalVisitsTitle}
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-paper-foreground">
                    {data.totalCheckIns}
                  </p>
                  <p className="mt-1 text-xs text-paper-foreground/60">{copy.overview.totalVisitsSubtitle}</p>
                </PaperCard>

                <PaperCard className="p-6">
                  <p className="text-xs font-bold tracking-wider text-paper-foreground/70 uppercase">
                    {copy.overview.trafficTitle}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold tracking-wide uppercase ${LEVEL_COLOR[trafficLevel]}`}
                    >
                      {VISITORS_COPY.traffic.levels[trafficLevel]}
                    </span>
                    <span className="text-2xl font-bold text-paper-foreground">
                      {copy.overview.visitsCount(data.recentCheckIns)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-paper-foreground/60">{copy.overview.trafficSubtitle}</p>
                </PaperCard>
              </div>

              {/* Estado del juego y accesos directos */}
              <div className="flex flex-col gap-4 rounded border border-border bg-surface/30 p-6">
                <div>
                  <span className="type-tiny text-muted uppercase">{copy.overview.gameInfoTitle}</span>
                  <h3 className="mt-1 font-wide text-lg font-bold text-foreground uppercase">
                    {data.game ? data.game.name : copy.overview.gamePendingTitle}
                  </h3>
                  <p className="mt-1 text-xs text-copy">
                    {data.game?.description ? data.game.description : copy.overview.gamePendingDesc}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectSection("scanner")}
                    className="flex items-center gap-2 rounded bg-accent px-4 py-2 font-mono text-xs font-bold tracking-wider text-background uppercase transition-opacity hover:opacity-90"
                  >
                    <span>{copy.overview.openScanner}</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSection("game")}
                    className="flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 font-mono text-xs font-bold tracking-wider text-foreground uppercase transition-colors hover:bg-surface/80"
                  >
                    <span>{copy.overview.editGame}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSection("members")}
                    className="flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 font-mono text-xs font-bold tracking-wider text-foreground uppercase transition-colors hover:bg-surface/80"
                  >
                    <span>{copy.overview.manageMembers(data.members.length)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sección 2: Escáner QR */}
          {activeSection === "scanner" && (
            <div className="flex flex-col gap-6">
              <TeamScanner />
            </div>
          )}

          {/* Sección 3: Gestión de Integrantes */}
          {activeSection === "members" && (
            <div className="flex flex-col gap-6">
              <TeamMemberManager members={data.members} />
            </div>
          )}

          {/* Sección 4: Ficha del Juego */}
          {activeSection === "game" && (
            <div className="flex flex-col gap-6">
              <TeamGameManager game={data.game} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
