import type { Metadata } from "next";
import { Suspense } from "react";
import { getEventContent } from "@features/event/lib/event-content";
import { PassportHeader } from "@features/visitors/components/passport-header";
import { PassportSkeleton } from "@features/visitors/components/passport-skeleton";
import { VisitorPassportView } from "@features/visitors/components/visitor-passport-view";
import { VisitorRegistrationForm } from "@features/visitors/components/visitor-registration-form";
import { getCurrentVisitorPassport } from "@features/visitors/lib/server/visitors-queries";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, UNKNOWN_QR_SEARCH_PARAM } from "@features/visitors/lib/visitors-links";

export const passportPageMetadata: Metadata = {
  title: VISITORS_COPY.page.title,
  description: VISITORS_COPY.page.description,
  alternates: { canonical: PASSPORT_PATH },
  // Es personal: depende de la cookie del visitante.
  robots: { index: false, follow: true },
};

type PassportPageProps = PageProps<"/passport">;

/** Lee la cookie del visitante: sin registro muestra el formulario; con registro, su pasaporte. */
async function PassportContent({ searchParams }: Readonly<PassportPageProps>) {
  const [passport, query] = await Promise.all([getCurrentVisitorPassport(), searchParams]);

  if (!passport) {
    return <VisitorRegistrationForm hasUnknownQr={query[UNKNOWN_QR_SEARCH_PARAM] === "unknown"} />;
  }

  return <VisitorPassportView passport={passport} />;
}

/**
 * Pasaporte del visitante (`/passport`). El encabezado se prerenderiza; el contenido depende de la
 * cookie, así que se transmite dentro de `<Suspense>`.
 */
export function PassportPage(props: PassportPageProps) {
  return (
    <main className="pt-[clamp(28px,4vw,48px)]">
      <div className="page-wrap flex flex-col gap-[clamp(24px,4vw,40px)]">
        <PassportHeader eventDateLabel={getEventContent().info.dateLabel} />
        <Suspense fallback={<PassportSkeleton />}>
          <PassportContent {...props} />
        </Suspense>
      </div>
    </main>
  );
}
