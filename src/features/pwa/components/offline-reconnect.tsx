"use client";

import { Button } from "@heroui/react";
import { ConnectionBadge } from "@features/pwa/components/connection-indicator";
import { useOfflineReconnect, type Navigate } from "@features/pwa/hooks/use-offline-reconnect";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.offline;

/**
 * The head of /offline: what happened, whether the phone has a network and a button to try again. While there is a
 * network it never says "Sin conexión": it says it is reaching for the server, and leaves the page when it answers.
 */
export function OfflineReconnect({ reconnectTo, navigate }: Readonly<{ reconnectTo: string; navigate?: Navigate }>) {
  const { state, isRetrying, retry } = useOfflineReconnect(reconnectTo, navigate);
  const message = state === "offline" ? COPY.description : COPY.reconnecting[state];

  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <h1 className="type-section">{state === "offline" ? COPY.title : COPY.reconnecting.title}</h1>
      <p className="max-w-[44ch] text-muted">{message}</p>
      <ConnectionBadge isOnline={state !== "offline"} />
      <Button variant="outline" className="touch-target relative min-h-11" isDisabled={isRetrying} onPress={retry}>
        {isRetrying ? COPY.retryPending : COPY.retry}
      </Button>
    </header>
  );
}
