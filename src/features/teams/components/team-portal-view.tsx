"use client";

import { useTransition } from "react";
import { TeamGameManager } from "@features/teams/components/team-game-manager";
import { TeamMemberManager } from "@features/teams/components/team-member-manager";
import { TeamScanner } from "@features/teams/components/team-scanner";
import type { TeamPortalData } from "@features/teams/lib/types";
import { getTrafficLevel, type TrafficLevel } from "@features/visitors/lib/stand-traffic";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import type { ActionResult } from "@shared/lib/action-result";

const LEVEL_COLOR: Record<TrafficLevel, string> = {
  low: "bg-success text-success-foreground",
  medium: "bg-warning text-warning-foreground",
  high: "bg-danger text-danger-foreground",
};

interface TeamPortalViewProps {
  data: TeamPortalData;
  onLogout?: () => Promise<ActionResult<{ redirectTo: string }>>;
}

export function TeamPortalView({ data, onLogout }: Readonly<TeamPortalViewProps>) {
  const [isPending, startTransition] = useTransition();
  const trafficLevel = getTrafficLevel(data.recentCheckIns);

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
    <div className="flex flex-col gap-8">
      {/* Encabezado del stand y equipo */}
      <header className="border-default-200 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-wide text-3xl font-bold tracking-[-.03em] uppercase">{data.name}</h1>
            {data.standCode ? (
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                Stand {data.standCode}
              </span>
            ) : (
              <span className="bg-default-200 text-default-600 rounded-full px-3 py-1 text-xs font-semibold">
                Stand por asignar
              </span>
            )}
          </div>
          <p className="mt-2 text-base text-copy">
            Juego en exhibición:{" "}
            <strong className="text-foreground">{data.game ? data.game.name : "Por registrar"}</strong>
          </p>
        </div>

        <ActionButton variant="secondary" onPress={handleLogout} isPending={isPending}>
          Cerrar sesión
        </ActionButton>
      </header>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PaperCard className="p-6">
          <p className="text-xs font-bold tracking-wider text-paper-foreground/70 uppercase">
            Total de Visitas Registradas
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-paper-foreground">{data.totalCheckIns}</p>
          <p className="mt-1 text-xs text-paper-foreground/60">Visitantes que han jugado la demo</p>
        </PaperCard>

        <PaperCard className="p-6">
          <p className="text-xs font-bold tracking-wider text-paper-foreground/70 uppercase">
            Afluencia Actual (Últimos 15 min)
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold tracking-wide uppercase ${LEVEL_COLOR[trafficLevel]}`}
            >
              {VISITORS_COPY.traffic.levels[trafficLevel]}
            </span>
            <span className="text-2xl font-bold text-paper-foreground">{data.recentCheckIns} visitas</span>
          </div>
          <p className="mt-1 text-xs text-paper-foreground/60">
            Refleja el flujo en tiempo real en el croquis interactivo
          </p>
        </PaperCard>
      </div>

      {/* Escáner de Códigos QR */}
      <TeamScanner />

      {/* Gestión de Integrantes del equipo por el Líder */}
      <TeamMemberManager members={data.members} />

      {/* Gestión de la Ficha del Juego por el Líder */}
      <TeamGameManager game={data.game} />
    </div>
  );
}
