import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_COPY } from "@features/site/lib/site-copy";
import type { NotFoundExit } from "@features/site/lib/types";
import { ActionLink } from "@shared/components/action-link";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

interface NotFoundViewProps {
  homeHref: string;
  exits: NotFoundExit[];
  /** Replaces the generic title and text, as the 404 of a game does. */
  title?: string;
  description?: string;
  /** What goes under the exits, such as a few games to keep browsing. */
  children?: ReactNode;
}

const COPY = SITE_COPY.notFound;

const EXITS_HEADING_ID = "not-found-exits-heading";

export function NotFoundView({
  homeHref,
  exits,
  title = COPY.title,
  description = COPY.description,
  children,
}: Readonly<NotFoundViewProps>) {
  return (
    <main className="page-wrap flex min-h-[calc(100svh-var(--spacing-nav))] flex-col gap-[clamp(40px,6vw,72px)] py-[clamp(48px,8vw,120px)]">
      <section className="flex flex-col items-start gap-6">
        <GlitchCode />
        <p className="type-tiny text-accent">{COPY.kicker}</p>
        <h1 className="type-giant wrap-break-word">{title}</h1>
        <p className="max-w-[46ch] text-copy">{description}</p>
        <ActionLink href={homeHref} variant="primary" arrow="w">
          {COPY.action}
        </ActionLink>
      </section>

      <nav aria-labelledby={EXITS_HEADING_ID} className="flex flex-col gap-4">
        <h2 id={EXITS_HEADING_ID} className="type-section">
          {COPY.exitsHeading}
        </h2>
        <ul className="grid gap-3 min-[560px]:grid-cols-3">
          {exits.map((exit) => (
            <li key={exit.href}>
              <ExitCard exit={exit} />
            </li>
          ))}
        </ul>
      </nav>

      {children}
    </main>
  );
}

// The "404" is decoration: the h1 says the same in words. The glitch layers are the ones of the hero arrow (components.css)
// and stop with prefers-reduced-motion.
function GlitchCode() {
  const layer = "type-giant text-[clamp(88px,22vw,240px)] leading-none";

  return (
    <span aria-hidden="true" className="relative inline-block select-none">
      <span className={`${layer} block glitch-layer-base text-foreground`}>{COPY.code}</span>
      <span className={`${layer} pointer-events-none absolute inset-0 glitch-layer-a text-accent-deep opacity-0`}>
        {COPY.code}
      </span>
      <span className={`${layer} pointer-events-none absolute inset-0 glitch-layer-b text-accent-hi opacity-0`}>
        {COPY.code}
      </span>
    </span>
  );
}

function ExitCard({ exit }: Readonly<{ exit: NotFoundExit }>) {
  return (
    <Link
      href={exit.href}
      className="group flex min-h-11 flex-col gap-1 border border-border bg-surface p-4 no-underline hover:border-accent focus-visible:border-accent"
    >
      <span className="flex items-center justify-between gap-3 type-wide text-sm text-foreground">
        {exit.label}
        <ArrowGlyph direction="e" />
      </span>
      <span className="type-tiny text-muted">{exit.description}</span>
    </Link>
  );
}
