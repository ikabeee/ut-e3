"use client";

import { useEffect } from "react";
import { ErrorView } from "@shared/components/error-view";
import { fontVariables } from "@shared/lib/fonts";
import "./globals.css";

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// Reemplaza al layout raíz cuando éste falla: define su propio documento, tema y estilos.
export default function GlobalErrorPage({ error, retry }: Readonly<GlobalErrorPageProps>) {
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
