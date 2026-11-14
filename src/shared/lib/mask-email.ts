const MASK = "***";

/**
 * An email that tells apart two people with the same name without giving the address away: the first letters of the
 * part before the @ and the whole domain ("ca***@gmail.com").
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");

  if (at < 1) return MASK;

  const local = email.slice(0, at);
  const shown = local.length > 3 ? 2 : 1;

  return `${local.slice(0, shown)}${MASK}${email.slice(at)}`;
}
