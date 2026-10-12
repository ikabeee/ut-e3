import { Suspense } from "react";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { AdminSummaryList } from "@features/admin/components/admin-summary-list";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminSummary } from "@features/admin/lib/server/admin-queries";

export const adminHomePageMetadata = buildAdminMetadata("home");

async function AdminHomeContent() {
  const summary = await getAdminSummary();
  return <AdminSummaryList summary={summary} />;
}

/** Portada del panel (`/admin`): cuántos equipos, juegos y ganadores hay. */
export function AdminHomePage() {
  return (
    <AdminShell current="home">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminHomeContent />
      </Suspense>
    </AdminShell>
  );
}
