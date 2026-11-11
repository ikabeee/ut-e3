"use client";

import { useEffect } from "react";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { ErrorView } from "@features/site/components/error-view";
import type { ErrorPageProps } from "@features/site/pages/error-page";
import { fontVariables } from "@shared/lib/fonts";

// Replaces the root layout when the layout itself fails (src/app/global-error.tsx), so it brings its own document and
// theme; the global styles are imported by the file of src/app.
export function GlobalErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" className={`dark ${fontVariables}`} data-theme="dark">
      <body className="bg-background text-foreground">
        <ErrorView homeHref={HOME_PATH} onRetry={retry} digest={error.digest} />
      </body>
    </html>
  );
}
