import { SITE_COPY } from "@features/site/lib/site-copy";
import { ActionLink } from "@shared/components/action-link";

interface NotFoundViewProps {
  homeHref: string;
}

export function NotFoundView({ homeHref }: Readonly<NotFoundViewProps>) {
  const copy = SITE_COPY.notFound;

  return (
    <main className="page-wrap flex min-h-[calc(100svh-var(--spacing-nav))] flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      <p className="type-tiny text-accent">{copy.kicker}</p>
      <h1 className="type-giant">{copy.title}</h1>
      <p className="max-w-[46ch] text-copy">{copy.description}</p>
      <ActionLink href={homeHref} variant="primary" arrow="w">
        {copy.action}
      </ActionLink>
    </main>
  );
}
