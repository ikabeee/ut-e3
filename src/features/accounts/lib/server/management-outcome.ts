import "server-only";
import { refresh } from "next/cache";
import { after } from "next/server";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";

// The email leaves after the answer, and the screen shows the new list at once.
export function finishManagement(message: string, emailId?: string): ManagementActionState {
  if (emailId) after(() => deliverQueuedEmail(emailId));

  refresh();

  return { status: "done", message };
}

export function failManagement(message: string): ManagementActionState {
  return { status: "error", message };
}
