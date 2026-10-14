import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@features/auth/lib/auth-actions";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";
import { TeamPortalView } from "@features/teams/components/team-portal-view";
import { getTeamPortalData } from "@features/teams/lib/server/team-portal-queries";
import { getAuthSession } from "@shared/lib/server/session";

export const teamPortalPageMetadata: Metadata = {
  title: "Portal del Equipo",
  description: "Panel de administración y escáner de visitas para equipos del showcase.",
  robots: { index: false, follow: false },
};

async function TeamPortalContent() {
  const session = await getAuthSession();

  if (!session || session.role !== "team" || !session.teamId) {
    redirect(LOGIN_PATH);
  }

  const data = await getTeamPortalData(session.teamId);

  if (!data) {
    redirect(LOGIN_PATH);
  }

  return <TeamPortalView data={data} onLogout={logoutAction} />;
}

export function TeamPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="font-display flex min-h-screen items-center justify-center text-muted">Cargando portal...</div>
      }
    >
      <TeamPortalContent />
    </Suspense>
  );
}
