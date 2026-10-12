"use client";

import { useEffect } from "react";
import { ErrorView } from "@features/site/components/error-view";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/** Error boundary de las rutas (`src/app/error.tsx`): registra el error y ofrece reintentar. */
export function ErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorView onRetry={retry} digest={error.digest} />;
}
