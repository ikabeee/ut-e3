import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { STAND_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireStandAccount } from "@features/accounts/lib/server/current-account";
import { StandKiosk, type KioskActions } from "@features/stands/components/stand-kiosk";
import { cancelVisitAction, requestVisitAction, submitVisitAction } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { getKioskStand } from "@features/stands/lib/server/visit-queries";

const COPY = STANDS_COPY.kiosk;

const KIOSK_ACTIONS: KioskActions = {
  requestVisit: requestVisitAction,
  submitVisit: submitVisitAction,
  cancelVisit: cancelVisitAction,
};

export const kioskPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: STAND_HOME_PATH },
  robots: { index: false, follow: false },
};

export function KioskPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <KioskPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the stand, so it streams behind the Suspense boundary.
async function KioskPanel() {
  await connection();

  const account = await requireStandAccount();
  const stand = await getKioskStand(account.standId);

  return (
    <>
      <AccountPageHeader title={COPY.title} signedInAs={COPY.signedInAs(account.name)} signOutAction={signOut} />
      {stand.gameName ? (
        <StandKiosk standCode={stand.code} gameName={stand.gameName} actions={KIOSK_ACTIONS} />
      ) : (
        <p role="status" className="m-0 border border-border p-6 text-lg">
          {COPY.noGame}
        </p>
      )}
    </>
  );
}
