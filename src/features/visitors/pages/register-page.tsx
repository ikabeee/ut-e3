import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { PrivacyNotice } from "@features/visitors/components/privacy-notice";
import { RegistrationForm } from "@features/visitors/components/registration-form";
import { registerVisitor } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { formatEventDate } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const registerPageMetadata: Metadata = {
  title: VISITORS_COPY.form.title,
  description: VISITORS_COPY.form.subtitle,
  alternates: { canonical: REGISTER_PATH },
  openGraph: buildOpenGraph({
    title: `${VISITORS_COPY.form.title} | ${siteConfig.title}`,
    description: VISITORS_COPY.form.subtitle,
    url: REGISTER_PATH,
  }),
};

interface RegisterViewProps {
  isOpen: boolean;
  registrationOpensAt: string;
}

export function RegisterPage() {
  return (
    <Suspense>
      <RegistrationGate />
    </Suspense>
  );
}

// Whether registration is open depends on the request time, so it renders at request time, not at build time.
async function RegistrationGate() {
  await connection();

  const settings = await getEventSettings();
  const isOpen = checkRegistrationOpen(settings.registrationOpensAt);

  return <RegisterView isOpen={isOpen} registrationOpensAt={settings.registrationOpensAt} />;
}

function checkRegistrationOpen(registrationOpensAt: string): boolean {
  return Date.now() >= Date.parse(registrationOpensAt);
}

export function RegisterView({ isOpen, registrationOpensAt }: Readonly<RegisterViewProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-8 py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-section">{VISITORS_COPY.form.title}</h1>
        <p className="text-muted">{VISITORS_COPY.form.subtitle}</p>
      </header>

      {isOpen ? (
        <>
          <RegistrationForm action={registerVisitor} />
          <PrivacyNotice />
        </>
      ) : (
        <p className="text-center text-muted">
          {VISITORS_COPY.closed(formatEventDate(registrationOpensAt, "numeric"))}
        </p>
      )}
    </main>
  );
}
