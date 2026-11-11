import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { RaffleLiveScreen } from "@features/raffle/components/raffle-live-screen";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_LIVE_PATH } from "@features/raffle/lib/raffle-links";
import { getRaffleLiveSnapshot } from "@features/raffle/lib/server/raffle-queries";

const COPY = RAFFLE_COPY.live;

export const raffleLivePageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: RAFFLE_LIVE_PATH },
  // It is live data: a search engine would keep an old copy of it.
  robots: { index: false, follow: true },
};

export function RaffleLivePage() {
  return (
    <main>
      <Suspense fallback={<p className="p-8 type-mono text-muted">{COPY.loading}</p>}>
        <LiveRaffle />
      </Suspense>
    </main>
  );
}

// The raffle changes with every spin, so it is read at request time and then followed by polling.
async function LiveRaffle() {
  await connection();

  return <RaffleLiveScreen initial={await loadSnapshot()} />;
}

function loadSnapshot() {
  return getRaffleLiveSnapshot(new Date());
}
