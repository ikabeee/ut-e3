"use server";

import { ADMIN_PORTAL_PATH, LOGIN_PATH, TEAM_PORTAL_PATH } from "@features/auth/lib/auth-links";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { parseLoginInput, parseRegisterTeamInput } from "@features/auth/lib/auth-validation";
import { authenticateUser, confirmEmailToken, registerTeamWithLeader } from "@features/auth/lib/server/auth-queries";
import { clearAuthSession, saveAuthSession } from "@features/auth/lib/server/auth-session";
import type { ActionResult } from "@shared/lib/action-result";
import { runServerAction } from "@shared/lib/server/server-action";
import type { RawInput } from "@shared/lib/validation";

const REGISTRATION_CONSTRAINTS = {
  team_name_key: "Ya existe un equipo registrado con ese nombre.",
  team_member_email_key: "Ya existe una cuenta registrada con ese correo electrónico.",
};

/** Inicia sesión verificando credenciales en la base de datos y creando la sesión httpOnly. */
export async function loginAction(input: RawInput): Promise<ActionResult<{ redirectTo: string }>> {
  return runServerAction(async () => {
    const valid = parseLoginInput(input);
    const result = await authenticateUser(valid.identifier, valid.password);

    if (result.unconfirmed) {
      throw new Error(AUTH_COPY.login.errors.unconfirmedEmail);
    }

    if (!result.success || !result.session) {
      throw new Error(AUTH_COPY.login.errors.invalidCredentials);
    }

    await saveAuthSession(result.session);

    const redirectTo = result.session.role === "admin" ? ADMIN_PORTAL_PATH : TEAM_PORTAL_PATH;

    return { redirectTo };
  });
}

/** Registra un nuevo equipo con su líder y envía el correo de confirmación. */
export async function registerTeamAction(input: RawInput): Promise<ActionResult<{ success: boolean }>> {
  return runServerAction(
    async () => {
      const valid = parseRegisterTeamInput(input);
      await registerTeamWithLeader(valid);

      return { success: true };
    },
    { constraintMessages: REGISTRATION_CONSTRAINTS },
  );
}

/** Confirma la cuenta de correo mediante el token recibido en el correo. */
export async function confirmEmailAction(token: string): Promise<ActionResult<{ confirmed: boolean }>> {
  return runServerAction(async () => {
    const ok = await confirmEmailToken(token);

    if (!ok) {
      throw new Error(AUTH_COPY.confirmEmail.errorMessage);
    }

    return { confirmed: true };
  });
}

/** Cierra la sesión activa borrando la cookie httpOnly. */
export async function logoutAction(): Promise<ActionResult<{ redirectTo: string }>> {
  return runServerAction(async () => {
    await clearAuthSession();

    return { redirectTo: LOGIN_PATH };
  });
}
