/** What each email of the outbox is, so the sysadmin can tell them apart and rebuild the ones that were abandoned. */
export const EMAIL_KINDS = [
  "visitor_passport",
  "recovery_link",
  "kof_entry",
  "staff_invitation",
  "login_code",
  "password_reset",
  "raffle_winner",
  "emergency",
] as const;

export type EmailKind = (typeof EMAIL_KINDS)[number];

/** Where an email comes from: its kind and the id of the record it is about (visitor, account, entry or draw). */
export interface EmailOrigin {
  kind: EmailKind;
  referenceId?: string;
}

export function isEmailKind(value: string | null): value is EmailKind {
  return EMAIL_KINDS.some((kind) => kind === value);
}
