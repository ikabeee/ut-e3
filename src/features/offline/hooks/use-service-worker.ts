import { useCallback, useEffect, useRef, useState } from "react";
import { SERVICE_WORKER_PATH, SKIP_WAITING_MESSAGE } from "@features/offline/lib/service-worker-config";

/**
 * Registra `/sw.js` y avisa cuando hay una versión nueva esperando. La versión nueva no se activa
 * sola: `applyUpdate()` la activa y recarga la página, para que nunca convivan el HTML viejo y
 * los archivos nuevos (o al revés).
 */
export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;

    // Sólo en producción (`npm run build && npm start`): en `npm run dev` el worker estorba.
    if (process.env.NODE_ENV !== "production") {
      // En desarrollo, quita un worker que haya quedado de `npm start` para no ver páginas viejas.
      void container.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });

      return;
    }

    let cancelled = false;
    // El registro y los workers viven más que este componente: sus listeners se quitan al
    // desmontar para no retener el componente (y su estado) en memoria.
    const removeListeners: (() => void)[] = [];

    const listen = (target: EventTarget, type: string, listener: () => void) => {
      target.addEventListener(type, listener);
      removeListeners.push(() => target.removeEventListener(type, listener));
    };

    // Recarga sólo cuando la persona aceptó la actualización (no en la primera instalación).
    listen(container, "controllerchange", () => {
      if (isUpdating.current) window.location.reload();
    });

    const showWhenInstalled = (worker: ServiceWorker | null) => {
      if (!worker) return;

      const update = () => {
        // Sólo es "versión nueva" si ya había un worker controlando la página.
        if (worker.state === "installed" && container.controller) setWaitingWorker(worker);
      };

      update();
      listen(worker, "statechange", update);
    };

    container
      .register(SERVICE_WORKER_PATH, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        // El registro puede terminar después de desmontar: entonces ya no se escucha nada.
        if (cancelled) return;

        showWhenInstalled(registration.waiting);
        listen(registration, "updatefound", () => showWhenInstalled(registration.installing));
      })
      .catch(() => {
        // Sin service worker el sitio funciona igual, sólo que no sin conexión.
      });

    return () => {
      cancelled = true;

      for (const removeListener of removeListeners) removeListener();
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    isUpdating.current = true;
    waitingWorker.postMessage({ type: SKIP_WAITING_MESSAGE });
  }, [waitingWorker]);

  return { isUpdateAvailable: waitingWorker !== null, applyUpdate };
}
