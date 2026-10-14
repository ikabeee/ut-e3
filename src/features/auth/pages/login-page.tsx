import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@features/auth/components/login-form";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";

export const loginPageMetadata: Metadata = {
  title: AUTH_COPY.login.title,
  description: AUTH_COPY.login.description,
  alternates: { canonical: LOGIN_PATH },
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams?: Promise<{ confirmed?: string }>;
}

async function LoginContent({ searchParams }: Readonly<LoginPageProps>) {
  const query = searchParams ? await searchParams : {};
  const confirmed = query.confirmed === "true";

  return <LoginForm confirmed={confirmed} />;
}

export function LoginPage(props: Readonly<LoginPageProps>) {
  return (
    <main className="page-wrap flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <Suspense fallback={<LoginForm confirmed={false} />}>
        <LoginContent {...props} />
      </Suspense>
    </main>
  );
}
