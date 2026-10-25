const MEXICAN_E164 = /^\+52(\d{3})(\d{3})(\d{4})$/;

export function formatPhone(phone: string): string {
  const trimmed = phone.trim();
  const match = MEXICAN_E164.exec(trimmed);

  if (!match) {
    return trimmed;
  }

  const [, areaCode, prefix, line] = match;

  return `${areaCode} ${prefix} ${line}`;
}
