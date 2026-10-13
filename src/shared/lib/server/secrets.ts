import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secretos de la plataforma (llave del escáner de un stand, token del QR de un visitante):
 * se generan con 128 bits aleatorios y la base sólo guarda su hash SHA-256.
 */
export function generateSecret() {
  return randomBytes(16).toString("hex");
}

/** SHA-256 en hexadecimal (64 caracteres), el formato que validan los `CHECK` de la base. */
export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

/** Compara dos textos en tiempo constante (contraseñas y llaves). */
export function safeEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}
