"use client";

import { Button } from "@heroui/react";
import { useServiceWorker } from "@features/offline/hooks/use-service-worker";

/** Registra el service worker y muestra el aviso "Hay una versión nueva" cuando corresponde. */
export function ServiceWorkerRegistration() {
  const { isUpdateAvailable, applyUpdate } = useServiceWorker();

  return (
    <div role="status" className="w-full max-w-xl">
      {isUpdateAvailable ? (
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 border border-border bg-surface px-4 py-3">
          <p className="type-mono m-0 text-sm text-foreground">Hay una versión nueva del sitio.</p>
          <Button variant="primary" size="sm" className="min-h-11" onPress={applyUpdate}>
            Actualizar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
