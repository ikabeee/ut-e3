"use client";

import { HOME_PATH } from "@features/home/lib/home-links";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { ActionButton } from "@shared/components/action-button";
import { ActionLink } from "@shared/components/action-link";
import { siteConfig } from "@shared/lib/site-config";

interface ErrorViewProps {
  /** Vuelve a pedir y renderizar el segmento que falló (`retry` de Next). */
  onRetry: () => void;
  /** Identificador del error en los logs del servidor, para reportarlo. */
  digest?: string;
}

/** Página de error con el mismo estilo que `NotFoundView`. */
export function ErrorView({ onRetry, digest }: Readonly<ErrorViewProps>) {
  const copy = SITE_COPY.error;

  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      {/* Los error boundaries no admiten `metadata`: React lleva este título al <head>. */}
      <title>{copy.documentTitle(siteConfig.name)}</title>
      <p className="type-tiny m-0 text-accent">{copy.kicker}</p>
      <h1 className="type-giant">{copy.title}</h1>
      <p className="m-0 max-w-[46ch] text-copy">{copy.description}</p>
      {digest ? <p className="type-mono m-0 text-muted">{copy.digest(digest)}</p> : null}
      <div className="flex flex-wrap gap-3">
        <ActionButton variant="primary" arrow="e" onPress={onRetry}>
          {copy.retry}
        </ActionButton>
        <ActionLink href={HOME_PATH}>{copy.home}</ActionLink>
      </div>
    </main>
  );
}
