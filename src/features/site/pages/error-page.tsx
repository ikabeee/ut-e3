"use client";

import { useEffect } from "react";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { ErrorView } from "@features/site/components/error-view";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// Error boundary of the routes (src/app/error.tsx): without it an exception, such as a Server Action that fails
// offline, shows the generic page of Next in English (RF-45.1).
export function ErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorView homeHref={HOME_PATH} onRetry={retry} digest={error.digest} />;
}
