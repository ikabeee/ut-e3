import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { ClearPassportSnapshot } from "@features/visitors/components/clear-passport-snapshot";
import { PrivacyNotice } from "@features/visitors/components/privacy-notice";
import { RecoveryEntryLink } from "@features/visitors/components/recovery-entry-link";
import { RegistrationForm } from "@features/visitors/components/registration-form";
import { registerVisitor } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { formatEventDate } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

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

// Whether registration is open depends on the request time, so it renders at request time, not at build time. A phone
// that already holds a passport goes to it ("Crear mi pasaporte" links here from every page): showing the form would
// delete its offline copy and let a second registration take the phone away from the first passport (RF-18).
async function RegistrationGate() {
  await connection();

  if (await getDeviceVisitorId()) redirect(PASSPORT_PATH);

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
      {/* A phone that reaches the registration has no active passport: its offline copy is deleted. */}
      <ClearPassportSnapshot />
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

      {/* /passport sends a phone without a passport here, so this is where a visitor on a new phone looks for it. */}
      <RecoveryEntryLink />
    </main>
  );
}
