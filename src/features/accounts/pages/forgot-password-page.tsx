import type { Metadata } from "next";
import { CenteredPage } from "@features/accounts/components/centered-page";
import { ForgotPasswordForm } from "@features/accounts/components/forgot-password-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { requestPasswordResetAction } from "@features/accounts/lib/password-reset-actions";

const COPY = ACCOUNTS_COPY.forgotPassword;

export const forgotPasswordPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: FORGOT_PASSWORD_PATH },
  robots: { index: false, follow: false },
};

export function ForgotPasswordPage() {
  return (
    <CenteredPage title={COPY.title}>
      <p className="max-w-sm text-center text-muted">{COPY.description}</p>
      <ForgotPasswordForm action={requestPasswordResetAction} />
      <a href={LOGIN_PATH} className="touch-target relative link-wipe no-underline">
        {COPY.backToLogin}
      </a>
    </CenteredPage>
  );
}
