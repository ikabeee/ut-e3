"use client";

import { useIsOffline } from "@features/offline/hooks/use-is-offline";

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
          Sin conexión. Lo que ya visitaste sigue disponible.
        </p>
      ) : null}
    </div>
  );
}
