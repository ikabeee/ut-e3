import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotFoundView } from "@features/site/components/not-found-view";
import { StandaloneErrorView } from "@features/site/components/standalone-error-view";
import { SITE_COPY } from "@features/site/lib/site-copy";

type ErrorsPageRouteProps = PageProps<"/errors/[type]">;

export const SUPPORTED_ERROR_TYPES = ["not-found", "404", "internal-server-error", "500"] as const;

export type SupportedErrorType = (typeof SUPPORTED_ERROR_TYPES)[number];

export function generateErrorsStaticParams() {
  return SUPPORTED_ERROR_TYPES.map((type) => ({ type }));
}

export async function generateErrorsMetadata({ params }: ErrorsPageRouteProps): Promise<Metadata> {
  const { type } = await params;

  if (type === "not-found" || type === "404") {
    return {
      title: SITE_COPY.notFound.title,
      robots: { index: false },
    };
  }

  if (type === "internal-server-error" || type === "500") {
    return {
      title: SITE_COPY.error.title,
      description: SITE_COPY.error.description,
      robots: { index: false },
    };
  }

  return {};
}

export async function ErrorsPage({ params }: ErrorsPageRouteProps) {
  const { type } = await params;

  if (type === "not-found" || type === "404") {
    return <NotFoundView />;
  }

  if (type === "internal-server-error" || type === "500") {
    return <StandaloneErrorView />;
  }

  notFound();
}
