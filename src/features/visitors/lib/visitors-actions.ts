"use server";

import {
  claimRaffleTicket,
  drawRaffleWinners,
  listRaffleWinners,
  markRaffleWinnerNotified,
} from "@features/visitors/lib/server/raffle-queries";
import { parseRaffleClaim, parseRaffleDraw, parseVisitorRegistration } from "@features/visitors/lib/visitor-rules";
import { getVisitorToken, saveVisitorToken } from "@features/visitors/lib/server/visitor-session";
import { registerVisitor, reissueVisitorQr } from "@features/visitors/lib/server/visitors-queries";
import { runAdminAction } from "@shared/lib/server/admin-action";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { runServerAction } from "@shared/lib/server/server-action";
import type { RawInput } from "@shared/lib/validation";

// Server Actions de los visitantes. Registrarse y pedir el boleto son públicas (no hay
// login: el visitante se identifica con la cookie de su QR); el sorteo y la reemisión del QR
// son del panel de administración.

const VISITOR_CONSTRAINT_MESSAGES = {
  visitor_email_key: "Ya existe un registro con este correo electrónico.",
  visitor_gamertag_key:
    "Ese nombre de usuario ya está registrado. Si es tuyo, abre la captura de tu código o pide ayuda en el módulo de información.",
  visitor_gamertag_format: "Usa de 3 a 24 caracteres: letras sin acento, números, guion bajo, punto o guion.",
  raffle_ticket_phone_key: "Ese teléfono ya tiene un boleto. Usa otro número.",
  raffle_ticket_phone_format: "Escribe tu número a 10 dígitos o con lada internacional (+52...).",
};

const NO_PASSPORT = "Primero regístrate con tu nombre y correo para obtener tu código de acceso.";

/** Registra al visitante y guarda su código en la sesión; la página se vuelve a renderizar sola. */
export async function registerVisitorAction(input: RawInput) {
  return runServerAction(
    async () => {
      const parsed = parseVisitorRegistration(input);
      const { token } = await registerVisitor(parsed);
      await saveVisitorToken(token);
    },
    { constraintMessages: VISITOR_CONSTRAINT_MESSAGES },
  );
}

/** Entrega el boleto del sorteo al visitante de la cookie si ya probó todos los juegos. */
export async function claimRaffleTicketAction(input: RawInput) {
  return runServerAction(
    async () => {
      const { phone } = parseRaffleClaim(input);
      const token = await getVisitorToken();

      if (!token) throw new RecordNotFoundError(NO_PASSPORT);

      return claimRaffleTicket(token, phone);
    },
    { constraintMessages: VISITOR_CONSTRAINT_MESSAGES, refreshPage: true },
  );
}

/** Lista de ganadores para el panel de administración. */
export async function listRaffleWinnersAction() {
  return runAdminAction(() => listRaffleWinners());
}

/** Sortea ganadores entre los boletos que no han ganado: `{ winners: 3 }`. */
export async function drawRaffleWinnersAction(input: RawInput) {
  return runAdminAction(() => drawRaffleWinners(parseRaffleDraw(input).winners));
}

export async function markRaffleWinnerNotifiedAction(ticketNumber: number) {
  return runAdminAction(() => markRaffleWinnerNotified(ticketNumber));
}

/** QR nuevo para un visitante que perdió el suyo; el anterior deja de servir. */
export async function reissueVisitorQrAction(gamertag: string) {
  return runAdminAction(() => reissueVisitorQr(parseVisitorRegistration({ gamertag }).gamertag));
}
