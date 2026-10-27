import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// OWASP minimum for scrypt: N = 2^17, r = 8, p = 1 (Password Storage Cheat Sheet). It needs 128 MiB, above Node's 32 MiB default maxmem.
const COST = 131_072;

const BLOCK_SIZE = 8;

const PARALLELISM = 1;

const MAX_MEMORY = 256 * 1024 * 1024;

const KEY_LENGTH = 64;

const SALT_LENGTH = 16;

const PREFIX = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, { N: COST, r: BLOCK_SIZE, p: PARALLELISM });

  return [PREFIX, COST, BLOCK_SIZE, PARALLELISM, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseStoredHash(stored);

  if (!parsed) {
    return false;
  }

  const key = await deriveKey(password, parsed.salt, parsed.options);

  return key.length === parsed.key.length && timingSafeEqual(key, parsed.key);
}

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { ...options, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

function parseStoredHash(stored: string) {
  const [prefix, cost, blockSize, parallelism, salt, key] = stored.split("$");
  const options = { N: Number(cost), r: Number(blockSize), p: Number(parallelism) };

  if (prefix !== PREFIX || !salt || !key || !Object.values(options).every(Number.isInteger)) {
    return null;
  }

  return { options, salt: Buffer.from(salt, "base64url"), key: Buffer.from(key, "base64url") };
}
