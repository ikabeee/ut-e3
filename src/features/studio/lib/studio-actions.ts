"use server";

import { validateContactForm } from "@features/studio/lib/contact-form";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import type { ContactFormState } from "@features/studio/lib/types";

/**
 * Server Action of the contact form of /studio. For now it only validates: there is no table or email for these
 * messages yet. When there is one, store `result.data` here.
 */
export async function sendContactMessage(_previous: ContactFormState, form: FormData): Promise<ContactFormState> {
  const result = validateContactForm(form);

  if (!result.ok) {
    return { status: "invalid", errors: result.errors };
  }

  return { status: "sent", message: STUDIO_COPY.contact.sent(result.data.name, result.data.email) };
}
