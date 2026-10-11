"use client";

import { useEffect } from "react";
import { ErrorView } from "@shared/components/error-view";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorView onRetry={retry} digest={error.digest} />;
}
