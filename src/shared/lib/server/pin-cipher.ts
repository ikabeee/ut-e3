import "server-only";

import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

const KEY_BYTE_LENGTH = 32;

const IV_BYTE_LENGTH = 12;

const AUTH_TAG_BYTE_LENGTH = 16;

const ENCRYPTION_KEY_INFO = "ut-game-showcase-pin-encryption";

const HMAC_LOOKUP_KEY_INFO = "ut-game-showcase-pin-hmac-lookup";

// Stored format: <iv_base64url>.<authTag_base64url>.<ciphertext_base64url>
export function encryptPin(pin: string): string {
  const encryptionKey = deriveKey(ENCRYPTION_KEY_INFO);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(pin, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptPin(stored: string): string {
  const encryptionKey = deriveKey(ENCRYPTION_KEY_INFO);
  const { iv, authTag, ciphertext } = parseStoredPayload(stored);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);

  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return plaintext.toString("utf8");
}

export function hashPinForLookup(pin: string): string {
  const hmacKey = deriveKey(HMAC_LOOKUP_KEY_INFO);
  const hmac = createHmac("sha256", hmacKey);

  hmac.update(pin, "utf8");

  return hmac.digest("hex");
}

function deriveKey(info: string): Buffer {
  const masterKey = readMasterKey();

  return Buffer.from(hkdfSync("sha256", masterKey, "", info, KEY_BYTE_LENGTH));
}

function readMasterKey(): Buffer {
  const rawKey = process.env.PIN_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "Falta configurar la variable de entorno PIN_ENCRYPTION_KEY. Genera una clave de 32 bytes con: openssl rand -base64 32",
    );
  }

  const keyBuffer = Buffer.from(rawKey, "base64");

  if (keyBuffer.length !== KEY_BYTE_LENGTH) {
    throw new Error(
      "La longitud de PIN_ENCRYPTION_KEY no es válida. Genera una clave de 32 bytes en base64 con: openssl rand -base64 32",
    );
  }

  return keyBuffer;
}

function parseStoredPayload(stored: string) {
  const parts = stored.split(".");

  if (parts.length !== 3) {
    throw new Error("Formato de PIN cifrado inválido.");
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  const iv = Buffer.from(ivBase64, "base64url");
  const authTag = Buffer.from(authTagBase64, "base64url");
  const ciphertext = Buffer.from(ciphertextBase64, "base64url");

  if (iv.length !== IV_BYTE_LENGTH || authTag.length !== AUTH_TAG_BYTE_LENGTH || ciphertext.length === 0) {
    throw new Error("Carga útil de PIN cifrado corrupta o incompleta.");
  }

  return { iv, authTag, ciphertext };
}
