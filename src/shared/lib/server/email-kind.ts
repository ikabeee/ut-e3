import "server-only";

// `email_outbox` has no `kind` column on this branch, so the kind is read from the subject the features write. The
// log gets only the kind, because a subject can carry a gamertag ("Tu pasaporte UT Game Showcase - <gamertag>").
const EMAIL_KINDS: [RegExp, string][] = [
  [/recupera tu pasaporte/i, "passport-recovery"],
  [/tu pasaporte/i, "passport"],
  [/c[oó]digo para entrar/i, "login-code"],
  [/cambia tu contrase[nñ]a/i, "password-reset"],
  [/activa tu cuenta/i, "invitation"],
  [/torneo de kof/i, "kof-entry"],
  [/ganaste la rifa/i, "raffle-winner"],
  [/^\[emergencia\]/i, "emergency"],
];

/** A fixed category for the log of an email: never the raw subject. */
export function describeEmailKind(subject: string): string {
  return EMAIL_KINDS.find(([pattern]) => pattern.test(subject))?.[1] ?? "other";
}
