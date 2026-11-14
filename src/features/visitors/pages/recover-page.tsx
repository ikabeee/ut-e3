import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RecoveryConfirmForm } from "@features/visitors/components/recovery-confirm-form";
import { RecoveryRequestForm } from "@features/visitors/components/recovery-request-form";
import { claimRecoveryLink, requestRecoveryEmail } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { RECOVER_PATH, RECOVERY_CONFIRM_PATH, RECOVERY_LINK_EXPIRED_PATH } from "@features/visitors/lib/visitors-links";

const COPY = VISITORS_COPY.recovery;

export const recoverPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.subtitle,
  alternates: { canonical: RECOVER_PATH },
};

export const recoverExpiredPageMetadata: Metadata = {
  title: COPY.expiredTitle,
  description: COPY.expiredNotice,
  alternates: { canonical: RECOVERY_LINK_EXPIRED_PATH },
  robots: { index: false },
};

export const recoverConfirmPageMetadata: Metadata = {
  title: COPY.confirmTitle,
  description: COPY.confirmNotice,
  alternates: { canonical: RECOVERY_CONFIRM_PATH },
  robots: { index: false },
};

/** Self-service recovery by email (RF-68): the visitor types the email and gets a one-use link. */
export function RecoverPage() {
  return <RecoveryRequest title={COPY.title} description={COPY.subtitle} />;
}

/** Where an expired, used or unknown link lands: it explains why and asks for a new one. */
export function RecoverExpiredPage() {
  return <RecoveryRequest title={COPY.expiredTitle} description={COPY.expiredNotice} />;
}

/** Where a valid email link lands; the link is used when the visitor confirms (RF-70). */
export function RecoverConfirmPage() {
  return (
    <RecoverLayout title={COPY.confirmTitle} description={COPY.confirmNotice}>
      <RecoveryConfirmForm action={claimRecoveryLink} />
    </RecoverLayout>
  );
}

function RecoveryRequest({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <RecoverLayout title={title} description={description}>
      <RecoveryRequestForm action={requestRecoveryEmail} />
      <p className="max-w-sm text-center type-tiny text-muted">{COPY.helpDesk}</p>
    </RecoverLayout>
  );
}

function RecoverLayout({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <main className="page-wrap flex min-h-[calc(100svh-var(--nav-height))] flex-col items-center justify-center gap-8 py-16">
      <header className="flex max-w-md flex-col items-center gap-2 text-center">
        <h1 className="type-section">{title}</h1>
        <p className="text-muted">{description}</p>
      </header>
      {children}
    </main>
  );
}
