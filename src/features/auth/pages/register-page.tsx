import type { Metadata } from "next";
import { RegisterForm } from "@features/auth/components/register-form";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { REGISTER_PATH } from "@features/auth/lib/auth-links";

export const registerPageMetadata: Metadata = {
  title: AUTH_COPY.register.title,
  description: AUTH_COPY.register.description,
  alternates: { canonical: REGISTER_PATH },
  robots: { index: false, follow: false },
};

export function RegisterPage() {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <RegisterForm />
    </main>
  );
}
