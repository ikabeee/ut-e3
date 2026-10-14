import "server-only";
import { connection } from "next/server";
import { hashPassword, verifyPassword } from "@features/auth/lib/server/auth-passwords";
import { sendConfirmationEmail } from "@features/auth/lib/server/email-service";
import type { AuthSession, RegisterTeamInput } from "@features/auth/lib/types";
import { db } from "@shared/lib/prisma/db";
import { generateSecret, hashSecret } from "@shared/lib/server/secrets";

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  unconfirmed?: boolean;
}

/**
 * Autentica un usuario verificando primero en la tabla `admin_user` y después en `team_member`.
 */
export async function authenticateUser(identifier: string, password: string): Promise<AuthResult> {
  await connection();
  const cleanId = identifier.trim().toLowerCase();

  // 1. Buscar en administradores (por username o email)
  const admin =
    (await db.orm.public.AdminUser.select("id", "username", "email", "passwordHash")
      .where({ username: cleanId })
      .first()) ??
    (await db.orm.public.AdminUser.select("id", "username", "email", "passwordHash").where({ email: cleanId }).first());

  if (admin && verifyPassword(password, admin.passwordHash)) {
    return {
      success: true,
      session: {
        role: "admin",
        userId: admin.id,
        email: admin.email,
        username: admin.username,
      },
    };
  }

  // 2. Buscar en integrantes de equipo (por email)
  const member = await db.orm.public.TeamMember.select("id", "email", "passwordHash", "isConfirmed", "fullName")
    .where({ email: cleanId })
    .include("team", (team) => team.select("id", "name", "standCode"))
    .first();

  if (member && member.team && verifyPassword(password, member.passwordHash)) {
    if (!member.isConfirmed) {
      return { success: false, unconfirmed: true };
    }

    return {
      success: true,
      session: {
        role: "team",
        userId: member.id,
        email: member.email,
        teamId: member.team.id,
        teamName: member.team.name,
        standCode: member.team.standCode,
      },
    };
  }

  return { success: false };
}

/**
 * Registra un nuevo equipo junto con su líder responsable, guarda el token de verificación y
 * envía el correo de confirmación con nodemailer.
 */
export async function registerTeamWithLeader(input: RegisterTeamInput): Promise<{ teamId: string; token: string }> {
  await connection();

  const scannerKey = generateSecret();
  const confirmationToken = generateSecret();
  const confirmationTokenHash = hashSecret(confirmationToken);
  const confirmationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const passwordHash = input.password ? hashPassword(input.password) : "";
  const cleanEmail = input.email.trim().toLowerCase();

  const team = await db.orm.public.Team.create({
    name: input.teamName.trim(),
    scannerKeyHash: hashSecret(scannerKey),
  });

  await db.orm.public.TeamMember.create({
    teamId: team.id,
    fullName: input.fullName.trim(),
    email: cleanEmail,
    passwordHash,
    groupName: input.groupName,
    isLeader: true,
    isConfirmed: false,
    confirmationTokenHash,
    confirmationExpiresAt,
    sortOrder: 0,
  });

  await sendConfirmationEmail(cleanEmail, input.fullName.trim(), confirmationToken);

  return { teamId: team.id, token: confirmationToken };
}

export interface ConfirmationTokenInfo {
  valid: boolean;
  fullName?: string;
  email?: string;
}

/**
 * Valida si el token de confirmación existe, no ha expirado y la cuenta no está confirmada aún.
 */
export async function checkConfirmationToken(token: string): Promise<ConfirmationTokenInfo> {
  await connection();

  if (!token || token.length !== 32) return { valid: false };
  const tokenHash = hashSecret(token);

  const member = await db.orm.public.TeamMember.select(
    "id",
    "email",
    "fullName",
    "isConfirmed",
    "confirmationExpiresAt",
  )
    .where({ confirmationTokenHash: tokenHash })
    .first();

  if (!member || member.isConfirmed) return { valid: false };

  if (member.confirmationExpiresAt && new Date(member.confirmationExpiresAt).getTime() < Date.now()) {
    return { valid: false };
  }

  return {
    valid: true,
    fullName: member.fullName,
    email: member.email,
  };
}

/**
 * Establece la contraseña del usuario y activa su cuenta confirmando el registro.
 */
export async function confirmEmailAndSetPassword(token: string, password: string): Promise<boolean> {
  await connection();

  if (!token || token.length !== 32 || password.length < 8) return false;
  const tokenHash = hashSecret(token);

  const member = await db.orm.public.TeamMember.select("id", "isConfirmed", "confirmationExpiresAt")
    .where({ confirmationTokenHash: tokenHash })
    .first();

  if (!member || member.isConfirmed) return false;

  if (member.confirmationExpiresAt && new Date(member.confirmationExpiresAt).getTime() < Date.now()) {
    return false;
  }

  const passwordHash = hashPassword(password);

  await db.orm.public.TeamMember.where({ id: member.id }).update({
    passwordHash,
    isConfirmed: true,
    confirmationTokenHash: null,
    confirmationExpiresAt: null,
  });

  return true;
}

/**
 * Valida el token recibido por correo y activa la cuenta del integrante.
 */
export async function confirmEmailToken(token: string): Promise<boolean> {
  await connection();

  if (!token || token.length !== 32) return false;
  const tokenHash = hashSecret(token);

  const member = await db.orm.public.TeamMember.select("id", "confirmationExpiresAt")
    .where({ confirmationTokenHash: tokenHash })
    .first();

  if (!member) return false;

  if (member.confirmationExpiresAt && new Date(member.confirmationExpiresAt).getTime() < Date.now()) {
    return false;
  }

  await db.orm.public.TeamMember.where({ id: member.id }).update({
    isConfirmed: true,
    confirmationTokenHash: null,
    confirmationExpiresAt: null,
  });

  return true;
}
