import { LANDING_COPY } from "@features/landing/lib/landing-copy";

type LandingPlaceholderProps = {
  organizationLabel: string;
};

export function LandingPlaceholder({ organizationLabel }: LandingPlaceholderProps) {
  return (
    <main className="page-wrap flex min-h-svh flex-col justify-center gap-4">
      <h1 className="type-wide text-3xl">{LANDING_COPY.title}</h1>
      <p className="text-copy">{LANDING_COPY.lead}</p>
      <p className="type-mono text-muted">{organizationLabel}</p>
    </main>
  );
}
