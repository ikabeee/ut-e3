import { ActionLink } from "@shared/components/action-link";
import { routes } from "@shared/lib/site-config";

/** Página 404 con el estilo del sitio. */
export function NotFoundView() {
  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      <p className="type-tiny m-0 text-accent">Error 404</p>
      <h1 className="type-giant">Página no encontrada</h1>
      <p className="m-0 max-w-[46ch] text-copy">
        La página que buscas no existe o cambió de dirección. Explora el catálogo para encontrar tu próximo juego.
      </p>
      <ActionLink href={routes.games} variant="primary" arrow="e">
        Ver todos los juegos
      </ActionLink>
    </main>
  );
}
