import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hashea una contraseña usando scrypt de node:crypto con una sal aleatoria de 16 bytes.
 * Formato almacenado: `<salt_hex>:<hash_hex>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado en tiempo constante.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");

  if (parts.length !== 2) return false;
  const [salt, expectedHash] = parts;

  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  const actualBuffer = Buffer.from(actualHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
