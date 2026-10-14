import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { LOGIN_PATH, REGISTER_PATH } from "@features/auth/lib/auth-links";

export const registerPageMetadata: Metadata = {
  title: AUTH_COPY.register.title,
  description: AUTH_COPY.register.description,
  alternates: { canonical: REGISTER_PATH },
  robots: { index: false, follow: false },
};

export function RegisterPage() {
  redirect(LOGIN_PATH);
}
