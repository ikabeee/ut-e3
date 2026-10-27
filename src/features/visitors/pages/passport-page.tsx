import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PassportCard } from "@features/visitors/components/passport-card";
import { getPassport } from "@features/visitors/lib/server/passport-queries";
import type { Passport } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

export const passportPageMetadata: Metadata = {
  title: VISITORS_COPY.passport.title,
  description: VISITORS_COPY.passport.subtitle,
  alternates: { canonical: PASSPORT_PATH },
  robots: { index: false },
};

interface PassportViewProps {
  passport: Passport;
}

export function PassportPage() {
  return (
    <Suspense>
      <PassportGate />
    </Suspense>
  );
}

// Device identity is resolved from the device cookie at request time.
async function PassportGate() {
  await connection();

  const visitorId = await getDeviceVisitorId();

  if (!visitorId) {
    redirect(REGISTER_PATH);
  }

  const passport = await getPassport(visitorId);

  if (!passport) {
    redirect(REGISTER_PATH);
  }

  return <PassportView passport={passport} />;
}

export function PassportView({ passport }: Readonly<PassportViewProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-8 py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-section">{VISITORS_COPY.passport.title}</h1>
        <p className="text-muted">{VISITORS_COPY.passport.subtitle}</p>
      </header>

      <PassportCard passport={passport} />
    </main>
  );
}
