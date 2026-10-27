import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

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
  const key = await deriveKey(password, salt);

  return [PREFIX, COST, BLOCK_SIZE, PARALLELISM, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseStoredHash(stored);

  if (!parsed) {
    return false;
  }

  const key = await deriveKey(password, parsed.salt);

  return key.length === parsed.key.length && timingSafeEqual(key, parsed.key);
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const options = { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: MAX_MEMORY };

  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

// Only the parameters hashPassword writes are accepted, so a corrupted value fails closed instead of making scrypt throw.
function parseStoredHash(stored: string) {
  const [prefix, cost, blockSize, parallelism, salt, key] = stored.split("$");
  const expected = [PREFIX, COST, BLOCK_SIZE, PARALLELISM].join("$");

  if ([prefix, cost, blockSize, parallelism].join("$") !== expected || !salt || !key) {
    return null;
  }

  return { salt: Buffer.from(salt, "base64url"), key: Buffer.from(key, "base64url") };
}
