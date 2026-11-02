import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignOutButton } from "@features/accounts/components/sign-out-button";
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-section">{COPY.title}</h1>
          <p className="mt-2 text-sm text-muted">{COPY.signedInAs(account.name)}</p>
        </div>
        <SignOutButton action={signOut} />
      </header>
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
