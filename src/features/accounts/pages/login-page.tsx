import type { Metadata } from "next";
import { LoginForm } from "@features/accounts/components/login-form";
import { signIn } from "@features/accounts/lib/accounts-actions";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";

const COPY = ACCOUNTS_COPY.signIn;

export const loginPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: LOGIN_PATH },
  robots: { index: false, follow: false },
};

export function LoginPage() {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-8 py-16">
      <h1 className="type-section">{COPY.title}</h1>
      <LoginForm action={signIn} />
    </main>
  );
}
