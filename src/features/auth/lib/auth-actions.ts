"use server";

import { ADMIN_PORTAL_PATH, LOGIN_PATH, TEAM_PORTAL_PATH } from "@features/auth/lib/auth-links";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { parseConfirmPasswordInput, parseLoginInput, parseRegisterTeamInput } from "@features/auth/lib/auth-validation";
import type {
  authenticateUser,
  confirmEmailAndSetPassword,
  confirmEmailToken,
  registerTeamWithLeader,
} from "@features/auth/lib/server/auth-queries";
import type { clearAuthSession, saveAuthSession } from "@features/auth/lib/server/auth-session";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import type { ActionResult } from "@shared/lib/action-result";
import { runServerAction } from "@shared/lib/server/server-action";
import type { RawInput } from "@shared/lib/validation";

const getAuthQueries = async () => import("@features/auth/lib/server/auth-queries");

const getAuthSession = async () => import("@features/auth/lib/server/auth-session");

const defaultAuthenticateUser: typeof authenticateUser = async (...args) =>
  (await getAuthQueries()).authenticateUser(...args);

const defaultSaveAuthSession: typeof saveAuthSession = async (...args) =>
  (await getAuthSession()).saveAuthSession(...args);

const defaultConfirmEmailAndSetPassword: typeof confirmEmailAndSetPassword = async (...args) =>
  (await getAuthQueries()).confirmEmailAndSetPassword(...args);

const defaultRegisterTeamWithLeader: typeof registerTeamWithLeader = async (...args) =>
  (await getAuthQueries()).registerTeamWithLeader(...args);

const defaultConfirmEmailToken: typeof confirmEmailToken = async (...args) =>
  (await getAuthQueries()).confirmEmailToken(...args);

const defaultClearAuthSession: typeof clearAuthSession = async (...args) =>
  (await getAuthSession()).clearAuthSession(...args);

const REGISTRATION_CONSTRAINTS = {
  team_name_key: "Ya existe un equipo registrado con ese nombre.",
  team_member_email_key: "Ya existe una cuenta registrada con ese correo electrónico.",
};

export interface LoginActionDeps {
  authenticateUser?: typeof authenticateUser;
  saveAuthSession?: typeof saveAuthSession;
}

/** Inicia sesión verificando credenciales en la base de datos y creando la sesión httpOnly. */
export async function loginAction(
  input: RawInput,
  deps?: LoginActionDeps,
): Promise<ActionResult<{ redirectTo: string }>> {
  const authenticate = deps?.authenticateUser ?? defaultAuthenticateUser;
  const saveSession = deps?.saveAuthSession ?? defaultSaveAuthSession;

  return runServerAction(async () => {
    const valid = parseLoginInput(input);
    const result = await authenticate(valid.identifier, valid.password);

    if (result.unconfirmed) {
      throw new ActionRuleError(AUTH_COPY.login.errors.unconfirmedEmail);
    }

    if (!result.success || !result.session) {
      throw new ActionRuleError(AUTH_COPY.login.errors.invalidCredentials);
    }

    await saveSession(result.session);

    const redirectTo = result.session.role === "admin" ? ADMIN_PORTAL_PATH : TEAM_PORTAL_PATH;

    return { redirectTo };
  });
}

/** Registra un nuevo equipo con su líder y envía el correo de confirmación. */
export async function registerTeamAction(input: RawInput): Promise<ActionResult<{ success: boolean }>> {
  return runServerAction(
    async () => {
      const valid = parseRegisterTeamInput(input);
      await defaultRegisterTeamWithLeader(valid);

      return { success: true };
    },
    { constraintMessages: REGISTRATION_CONSTRAINTS },
  );
}

/** Confirma la cuenta de correo mediante el token recibido en el correo. */
export async function confirmEmailAction(token: string): Promise<ActionResult<{ confirmed: boolean }>> {
  return runServerAction(async () => {
    const ok = await defaultConfirmEmailToken(token);

    if (!ok) {
      throw new ActionRuleError(AUTH_COPY.confirmEmail.errorMessage);
    }

    return { confirmed: true };
  });
}

export interface ConfirmEmailAndSetPasswordActionDeps {
  confirmEmailAndSetPassword?: typeof confirmEmailAndSetPassword;
}

/** Confirma la cuenta y establece la contraseña del líder mediante el token recibido por correo. */
export async function confirmEmailAndSetPasswordAction(
  input: RawInput,
  deps?: ConfirmEmailAndSetPasswordActionDeps,
): Promise<ActionResult<{ confirmed: boolean }>> {
  const confirm = deps?.confirmEmailAndSetPassword ?? defaultConfirmEmailAndSetPassword;

  return runServerAction(async () => {
    const valid = parseConfirmPasswordInput(input);
    const ok = await confirm(valid.token, valid.password);

    if (!ok) {
      throw new ActionRuleError(AUTH_COPY.confirmEmail.errorMessage);
    }

    return { confirmed: true };
  });
}

/** Cierra la sesión activa borrando la cookie httpOnly. */
export async function logoutAction(): Promise<ActionResult<{ redirectTo: string }>> {
  return runServerAction(async () => {
    await defaultClearAuthSession();

    return { redirectTo: LOGIN_PATH };
  });
}
