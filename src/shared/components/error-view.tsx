"use client";

import { ActionButton } from "@shared/components/action-button";
import { ActionLink } from "@shared/components/action-link";
import { routes, siteConfig } from "@shared/lib/site-config";

interface ErrorViewProps {
  /** Vuelve a pedir y renderizar el segmento que falló (`retry` de Next). */
  onRetry: () => void;
  /** Identificador del error en los logs del servidor, para reportarlo. */
  digest?: string;
}

/** Página de error con el mismo estilo que `NotFoundView`. */
export function ErrorView({ onRetry, digest }: Readonly<ErrorViewProps>) {
  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      {/* Los error boundaries no admiten `metadata`: React lleva este título al <head>. */}
      <title>{`Algo salió mal · ${siteConfig.name}`}</title>
      <p className="type-tiny m-0 text-accent">Error</p>
      <h1 className="type-giant">Algo salió mal</h1>
      <p className="m-0 max-w-[46ch] text-copy">
        No pudimos cargar esta página. Intenta de nuevo en unos segundos o vuelve al inicio para seguir explorando.
      </p>
      {digest ? <p className="type-mono m-0 text-muted">Código: {digest}</p> : null}
      <div className="flex flex-wrap gap-3">
        <ActionButton variant="primary" arrow="e" onPress={onRetry}>
          Reintentar
        </ActionButton>
        <ActionLink href={routes.home}>Ir al inicio</ActionLink>
      </div>
    </main>
  );
}
