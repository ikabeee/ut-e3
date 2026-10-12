"use client";

import { useIsOffline } from "@features/offline/hooks/use-is-offline";
import { OFFLINE_COPY } from "@features/offline/lib/offline-copy";

/**
 * Aviso de conexión (ver `useIsOffline`). La región `role="status"` existe siempre para que los
 * lectores de pantalla anuncien el cambio.
 */
export function OfflineBanner() {
  const isOffline = useIsOffline();

  return (
    <div role="status" className="w-full max-w-xl">
      {isOffline ? (
        <p className="type-mono pointer-events-auto m-0 border border-accent bg-background px-4 py-3 text-sm text-foreground">
          {OFFLINE_COPY.banner}
        </p>
      ) : null}
    </div>
  );
}
