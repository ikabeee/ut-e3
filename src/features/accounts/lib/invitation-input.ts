import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { KofDesk } from "@features/accounts/lib/types";
import { readFormText } from "@shared/lib/form-data";

export interface InviteInput {
  name: string;
  email: string;
  role: string;
  /** Only a KOF staff member has a desk. */
  kofDesk: KofDesk | null;
}

export type ParsedInviteInput = { isValid: true; input: InviteInput } | { isValid: false; message: string };

const ERRORS = ACCOUNTS_COPY.management.errors;

const NAME_MAX_LENGTH = 80;

const EMAIL_MAX_LENGTH = 254;

/** Reads the invite form of a Server Action; whether the actor may invite that role is checked later. */
export function parseInviteInput(form: FormData): ParsedInviteInput {
  const name = readFormText(form, "name").trim();
  const email = readFormText(form, "email").trim().toLowerCase();
  const role = readFormText(form, "role").trim();
  const desk = parseDesk(readFormText(form, "desk").trim());

  if (!name || name.length > NAME_MAX_LENGTH) return invalid(ERRORS.nameRequired);

  if (!looksLikeEmail(email)) return invalid(ERRORS.emailInvalid);

  if (!role) return invalid(ERRORS.roleRequired);

  if (desk === "invalid") return invalid(ERRORS.deskInvalid);

  return { isValid: true, input: { name, email, role, kofDesk: desk } };
}

function parseDesk(value: string): KofDesk | null | "invalid" {
  if (value === "") return null;

  if (value === "1") return 1;

  return value === "2" ? 2 : "invalid";
}

function invalid(message: string): ParsedInviteInput {
  return { isValid: false, message };
}

// One at sign with something before it, and a dot inside the domain; the mailer is the real validation.
function looksLikeEmail(email: string): boolean {
  const parts = email.split("@");

  if (email.length > EMAIL_MAX_LENGTH || parts.length !== 2 || /\s/.test(email)) return false;

  const [local, domain] = parts;
  const dot = domain.indexOf(".");

  return local.length > 0 && dot > 0 && dot < domain.length - 1;
}
