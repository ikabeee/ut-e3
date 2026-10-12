import { OfflineBanner } from "@features/offline/components/offline-banner";
import { ServiceWorkerRegistration } from "@features/offline/components/service-worker-registration";

/**
 * Avisos de conexión y de actualización. Van fijos abajo para no tapar la barra de navegación y
 * respetan el área segura del teléfono. El contenedor no recibe toques; sólo los avisos visibles.
 */
export function OfflineNotices() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <OfflineBanner />
      <ServiceWorkerRegistration />
    </div>
  );
}
