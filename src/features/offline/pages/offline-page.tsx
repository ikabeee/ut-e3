import type { Metadata } from "next";
import { ActionLink } from "@shared/components/action-link";
import { routes } from "@shared/lib/site-config";

/** Página de respaldo del service worker: no se indexa ni va en el sitemap. */
export const offlinePageMetadata: Metadata = {
  title: "Sin conexión",
  description: "Esta página no está guardada en tu dispositivo. Vuelve a las secciones disponibles sin conexión.",
  robots: { index: false, follow: false },
};

export function OfflinePage() {
  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      <p className="type-tiny m-0 text-accent">Sin conexión</p>
      <h1 className="type-giant">Estás sin conexión</h1>
      <p className="m-0 max-w-[46ch] text-copy">
        Esta página no está guardada en tu dispositivo. El catálogo, el detalle de cada juego y el croquis siguen
        disponibles sin internet.
      </p>
      <nav aria-label="Secciones disponibles sin conexión" className="flex flex-wrap gap-3">
        <ActionLink href={routes.home} variant="primary" arrow="e">
          Inicio
        </ActionLink>
        <ActionLink href={routes.games} arrow="e">
          Juegos
        </ActionLink>
        <ActionLink href={routes.floorPlan} arrow="e">
          Croquis
        </ActionLink>
      </nav>
    </main>
  );
}
