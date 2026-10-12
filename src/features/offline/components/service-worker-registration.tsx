"use client";

import { Button } from "@heroui/react";
import { useServiceWorker } from "@features/offline/hooks/use-service-worker";
import { OFFLINE_COPY } from "@features/offline/lib/offline-copy";

/** Registra el service worker y muestra el aviso "Hay una versión nueva" cuando corresponde. */
export function ServiceWorkerRegistration() {
  const { isUpdateAvailable, applyUpdate } = useServiceWorker();

  return (
    <div role="status" className="w-full max-w-xl">
      {isUpdateAvailable ? (
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 border border-border bg-surface px-4 py-3">
          <p className="m-0 type-mono text-sm text-foreground">{OFFLINE_COPY.update.message}</p>
          <Button variant="primary" size="sm" className="min-h-11" onPress={applyUpdate}>
            {OFFLINE_COPY.update.action}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
