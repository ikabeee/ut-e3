type FieldErrors = Readonly<Record<string, string | readonly string[] | undefined>>;

/** The messages of the fields a form refused, in one line for a toast; each message once. Null when there is none. */
export function joinFieldErrors(errors: FieldErrors | null | undefined): string | null {
  const messages = new Set(Object.values(errors ?? {}).flatMap((message) => message ?? []));

  return messages.size === 0 ? null : [...messages].join(" ");
}
