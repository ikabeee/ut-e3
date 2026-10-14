import { Suspense } from "react";
import { logoutAction } from "@features/auth/lib/auth-actions";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { RaffleDrawForm } from "@features/admin/components/raffle-draw-form";
import { RaffleWinnerList } from "@features/admin/components/raffle-winner-list";
import { ReissueQrForm } from "@features/admin/components/reissue-qr-form";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminRaffleWinners } from "@features/admin/lib/server/admin-queries";

export const adminRafflePageMetadata = buildAdminMetadata("raffle");

async function AdminRaffleContent() {
  const winners = await getAdminRaffleWinners();

  return (
    <>
      <AdminPanel title={ADMIN_COPY.raffle.drawTitle} hint={ADMIN_COPY.raffle.drawHint}>
        <RaffleDrawForm />
      </AdminPanel>
      <AdminPanel title={ADMIN_COPY.raffle.winners}>
        <RaffleWinnerList winners={winners} />
      </AdminPanel>
      <AdminPanel title={ADMIN_COPY.raffle.reissueTitle} hint={ADMIN_COPY.raffle.reissueHint}>
        <ReissueQrForm />
      </AdminPanel>
    </>
  );
}

/** Sorteo (`/admin/raffle`): sortear, avisar a los ganadores y reponer QR perdidos. */
export function AdminRafflePage() {
  return (
    <AdminShell current="raffle" onLogout={logoutAction}>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminRaffleContent />
      </Suspense>
    </AdminShell>
  );
}
