"use client";

import { ErrorView } from "@features/site/components/error-view";

export interface StandaloneErrorViewProps {
  onRetry?: () => void;
}

/**
 * Vista de error para rutas independientes (`/errors/500`, `/errors/internal-server-error`).
 * Al reintentar, recarga la ventana actual por defecto.
 */
export function StandaloneErrorView({ onRetry }: Readonly<StandaloneErrorViewProps> = {}) {
  const handleRetry = onRetry ?? (() => window.location.reload());

  return <ErrorView onRetry={handleRetry} />;
}
