import "server-only";
import { createMissingDevAccounts } from "@features/accounts/lib/server/dev-accounts";

export type SupportDevEnv = Readonly<Record<string, string | undefined>>;

// An example value for local development only; SUPPORT_DEV_PASSWORD replaces it.
export const SUPPORT_DEV_DEFAULT_PASSWORD = "support-dev-password";

export const SUPPORT_DEV_HELP_DESK_EMAIL = "help-desk@ejemplo.com";

const PRODUCTION_REFUSED =
  "Seed de soporte: se niega a correr en producción (NODE_ENV=production). Es solo para desarrollo: crea una cuenta con una contraseña de ejemplo.";

/** Prepares the recovery desk for a manual test (development only). Running it again only adds what is missing. */
export async function seedSupportDev(env: SupportDevEnv): Promise<string[]> {
  if (env.NODE_ENV === "production") throw new Error(PRODUCTION_REFUSED);

  const password = env.SUPPORT_DEV_PASSWORD?.trim() || SUPPORT_DEV_DEFAULT_PASSWORD;

  return createMissingDevAccounts(
    [{ email: SUPPORT_DEV_HELP_DESK_EMAIL, name: "Atención (prueba)", role: "help_desk" }],
    password,
  );
}
