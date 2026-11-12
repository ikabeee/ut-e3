import type { Metadata } from "next";
import { OfflineReconnect } from "@features/pwa/components/offline-reconnect";
import { OFFLINE_PATH } from "@features/pwa/lib/pwa-links";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { OfflinePassport } from "@features/visitors/components/offline-passport";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { ActionLink } from "@shared/components/action-link";

const COPY = PWA_COPY.offline;

export const offlinePageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: OFFLINE_PATH },
  robots: { index: false, follow: false },
};

/**
 * What the service worker shows when a page cannot be loaded and has no saved copy. If the phone saved the passport it
 * appears here, with its age. The page asks the server by itself and returns to what the visitor wanted as soon as it
 * answers, and a button lets the visitor try again.
 */
export function OfflinePage() {
  return (
    <main className="page-wrap flex min-h-[calc(100svh-var(--nav-height))] flex-col items-center gap-8 py-16">
      <OfflineReconnect reconnectTo={PASSPORT_PATH} />

      <OfflinePassport fallback={<NoSavedCopy />} />
    </main>
  );
}

function NoSavedCopy() {
  return (
    <section aria-labelledby="offline-browse" className="flex flex-col items-center gap-4 text-center">
      <h2 id="offline-browse" className="type-mono">
        {COPY.noCopyTitle}
      </h2>
      <p className="max-w-[44ch] text-copy">{COPY.noCopy}</p>
      <p className="type-tiny text-muted">{COPY.retrying}</p>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0" aria-label={COPY.browseTitle}>
        <li>
          <ActionLink href={GAMES_PATH}>{COPY.games}</ActionLink>
        </li>
        <li>
          <ActionLink href="/">{COPY.home}</ActionLink>
        </li>
      </ul>
    </section>
  );
}
