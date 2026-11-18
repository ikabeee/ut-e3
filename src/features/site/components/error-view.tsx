"use client";

import { Button } from "@heroui/react";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { ActionLink } from "@shared/components/action-link";
import { useErrorToast } from "@shared/hooks/use-error-toast";
import { siteConfig } from "@shared/lib/site-config";

interface ErrorViewProps {
  homeHref: string;
  /** Fetches and renders the segment that failed again (`retry` of Next). */
  onRetry: () => void;
  /** Id of the error in the server log, to report it. */
  digest?: string;
}

const COPY = SITE_COPY.error;

// What went wrong is told by a toast (S7); the page keeps the way out: retry or go home.
export function ErrorView({ homeHref, onRetry, digest }: Readonly<ErrorViewProps>) {
  useErrorToast(COPY.description);

  return (
    <main className="page-wrap flex flex-col items-start gap-6 py-[clamp(48px,8vw,120px)]">
      <title>{COPY.documentTitle(siteConfig.name)}</title>
      <p className="m-0 type-tiny text-accent">{COPY.kicker}</p>
      <h1 className="type-giant wrap-break-word">{COPY.title}</h1>
      {digest ? <p className="m-0 type-mono text-muted">{COPY.digest(digest)}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" className="min-h-11" onPress={onRetry}>
          {COPY.retry}
        </Button>
        <ActionLink href={homeHref}>{COPY.home}</ActionLink>
      </div>
    </main>
  );
}
