import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmEmailStatus } from "@features/auth/components/confirm-email-status";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { CONFIRM_EMAIL_PATH } from "@features/auth/lib/auth-links";
import { confirmEmailToken } from "@features/auth/lib/server/auth-queries";

export const confirmEmailPageMetadata: Metadata = {
  title: AUTH_COPY.confirmEmail.title,
  description: AUTH_COPY.confirmEmail.description,
  alternates: { canonical: CONFIRM_EMAIL_PATH },
  robots: { index: false, follow: false },
};

interface ConfirmEmailPageProps {
  searchParams?: Promise<{ token?: string }>;
}

async function ConfirmEmailContent({ searchParams }: Readonly<ConfirmEmailPageProps>) {
  const query = searchParams ? await searchParams : {};
  const token = query.token ?? "";
  const isConfirmed = token ? await confirmEmailToken(token) : false;

  return <ConfirmEmailStatus isConfirmed={isConfirmed} />;
}

export function ConfirmEmailPage(props: Readonly<ConfirmEmailPageProps>) {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <Suspense fallback={<ConfirmEmailStatus isConfirmed={false} />}>
        <ConfirmEmailContent {...props} />
      </Suspense>
    </main>
  );
}
