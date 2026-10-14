import "server-only";
import { connection } from "next/server";
import { sendVisitorQrEmail } from "@features/visitors/lib/server/visitor-email-service";
import type { ReissuedVisitorQr, VisitorPassport } from "@features/visitors/lib/types";
import { buildVisitorQrUrl, isVisitorToken, normalizeGamertag } from "@features/visitors/lib/visitor-rules";
import { getVisitorToken } from "@features/visitors/lib/server/visitor-session";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import type { sendMail } from "@shared/lib/server/mailer";
import { generateSecret, hashSecret } from "@shared/lib/server/secrets";
import { siteConfig } from "@shared/lib/site-config";
import { isString } from "@shared/lib/validation";

// Visitantes: registro con gamertag, pasaporte (QR + avance + boleto) y reemisión del QR.
// La base sólo guarda el hash del token; el token sólo lo conocen la cookie y el QR.

export interface RequiredGame {
  id: string;
  slug: string;
  name: string;
  standCode: string;
}

/** Juegos que cuentan para el boleto: los de equipos con stand asignado, en orden de stand. */
export async function listRequiredGames(): Promise<RequiredGame[]> {
  const teams = await db.orm.public.Team.select("standCode")
    .where((team) => team.standCode.isNotNull())
    .include("game", (game) => game.select("id", "slug", "name"))
    .orderBy((team) => team.standCode.asc())
    .all();

  return teams.flatMap(({ standCode, game }) => (standCode && game ? [{ ...game, standCode }] : []));
}

export interface RegisterVisitorInput {
  fullName?: string | null;
  email?: string | null;
  gamertag: string;
}

/** Busca al visitante dueño de un token; `null` si el token no existe o ya se reemplazó. */
export async function findVisitorByToken(token: string) {
  if (!isVisitorToken(token)) return null;

  return db.orm.public.Visitor.select("id", "gamertag", "fullName", "email")
    .where({ qrTokenHash: hashSecret(token) })
    .first();
}

/** Registra al visitante, devuelve el token de su QR y envía copia por correo si tiene correo. */
export async function registerVisitor(
  input: string | RegisterVisitorInput,
  mailSender?: typeof sendMail,
): Promise<{ token: string }> {
  const token = generateSecret();
  const data = isString(input) ? { gamertag: input } : input;
  const gamertag = normalizeGamertag(data.gamertag);
  const fullName = data.fullName?.trim() || null;
  const email = data.email?.trim().toLowerCase() || null;

  await db.orm.public.Visitor.create({
    gamertag,
    fullName,
    email,
    qrTokenHash: hashSecret(token),
  });

  if (email && fullName) {
    try {
      await sendVisitorQrEmail(email, fullName, token, mailSender);
    } catch (error) {
      console.error("No se pudo enviar el correo con el código al visitante:", error);
    }
  }

  return { token };
}

/** Pasaporte del visitante dueño del token, o `null` si el token ya no es válido. */
export async function getVisitorPassport(token: string): Promise<VisitorPassport | null> {
  await connection();

  if (!isVisitorToken(token)) return null;

  const visitor = await db.orm.public.Visitor.select("gamertag")
    .where({ qrTokenHash: hashSecret(token) })
    .include("checkIns", (checkIns) => checkIns.select("gameId"))
    .include("raffleTicket", (ticket) => ticket.select("ticketNumber", "wonAt"))
    .first();

  if (!visitor) return null;

  const checkedGameIds = new Set(visitor.checkIns.map((checkIn) => checkIn.gameId));

  const games = (await listRequiredGames()).map(({ id, slug, name, standCode }) => ({
    slug,
    name,
    standCode,
    isChecked: checkedGameIds.has(id),
  }));

  return {
    gamertag: visitor.gamertag,
    qrUrl: buildVisitorQrUrl(siteConfig.url, token),
    games,
    checkedCount: games.filter((game) => game.isChecked).length,
    requiredCount: games.length,
    ticket: visitor.raffleTicket ? { ...visitor.raffleTicket } : null,
  };
}

/** Pasaporte del visitante de esta petición (cookie), o `null` si no se ha registrado. */
export async function getCurrentVisitorPassport(): Promise<VisitorPassport | null> {
  const token = await getVisitorToken();

  return token ? getVisitorPassport(token) : null;
}

/**
 * Genera un QR nuevo para un visitante que perdió el suyo (módulo de información). El QR
 * anterior deja de servir; sus check-ins y su boleto se conservan.
 */
export async function reissueVisitorQr(gamertag: string): Promise<ReissuedVisitorQr> {
  const token = generateSecret();

  const updated = await db.orm.public.Visitor.where({ gamertag: normalizeGamertag(gamertag) }).update({
    qrTokenHash: hashSecret(token),
  });

  if (!updated) throw new RecordNotFoundError("No hay ningún visitante con ese gamertag.");

  return { gamertag: updated.gamertag, qrUrl: buildVisitorQrUrl(siteConfig.url, token) };
}
