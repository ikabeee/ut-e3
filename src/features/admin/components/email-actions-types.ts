import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import type { EmailTextState } from "@features/admin/lib/types";

export type EmailManagementAction = (
  previous: ManagementActionState | null,
  form: FormData,
) => Promise<ManagementActionState>;

export type EmailTextAction = (previous: EmailTextState | null, form: FormData) => Promise<EmailTextState>;

/** The Server Actions the page hands to the panel, so the components never import them. */
export interface EmailActions {
  resend: EmailManagementAction;
  rebuild: EmailManagementAction;
  view: EmailTextAction;
  resendFailed: EmailManagementAction;
  sendNow: EmailManagementAction;
}
