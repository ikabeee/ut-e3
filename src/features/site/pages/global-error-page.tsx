"use client";

import { useEffect } from "react";
import { ErrorView } from "@features/site/components/error-view";
import type { ErrorPageProps } from "@features/site/pages/error-page";
import { fontVariables } from "@shared/lib/fonts";

/**
 * Reemplaza al layout raíz cuando éste falla (`src/app/global-error.tsx`): define su propio
 * documento y tema. Los estilos globales los importa el archivo de `src/app`.
 */
export function GlobalErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" className={`dark ${fontVariables}`} data-theme="dark">
      <body className="bg-background text-foreground">
        <ErrorView onRetry={retry} digest={error.digest} />
      </body>
    </html>
  );
}
