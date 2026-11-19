import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP minimum for scrypt: N = 2^17, r = 8, p = 1 (Password Storage Cheat Sheet). It needs 128 MiB, above Node's 32 MiB default maxmem.
const PRODUCTION_COST = 131_072;

// Cheap parameters that only a Jest run can switch on (see setPasswordCostForTests).
const TEST_COST = 16;

let cost = PRODUCTION_COST;

const BLOCK_SIZE = 8;

const PARALLELISM = 1;

const MAX_MEMORY = 256 * 1024 * 1024;

const KEY_LENGTH = 64;

const SALT_LENGTH = 16;

const PREFIX = "scrypt";

// Called from jest.setup.ts so the suites do not spend ~150 ms of scrypt per hash. Production never calls it, and it refuses to run in production.
export function setPasswordCostForTests() {
  assertTestEnvironment();

  cost = TEST_COST;
}

export function restorePasswordCostForTests() {
  assertTestEnvironment();

  cost = PRODUCTION_COST;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, cost);

  return [PREFIX, cost, BLOCK_SIZE, PARALLELISM, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseStoredHash(stored);

  if (!parsed) {
    return false;
  }

  const key = await deriveKey(password, parsed.salt, parsed.cost);

  return key.length === parsed.key.length && timingSafeEqual(key, parsed.key);
}

function deriveKey(password: string, salt: Buffer, keyCost: number): Promise<Buffer> {
  const options = { N: keyCost, r: BLOCK_SIZE, p: PARALLELISM, maxmem: MAX_MEMORY };

  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

function assertTestEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The password cost can only be lowered in tests.");
  }
}

// Only the parameters hashPassword can write are accepted (the test cost only while the test override is on), so a corrupted value fails closed instead of making scrypt throw.
function parseStoredHash(stored: string) {
  const [prefix, storedCost, blockSize, parallelism, salt, key] = stored.split("$");
  const acceptedCosts = cost === PRODUCTION_COST ? [PRODUCTION_COST] : [PRODUCTION_COST, cost];

  const hasAcceptedParameters =
    prefix === PREFIX &&
    acceptedCosts.some((accepted) => String(accepted) === storedCost) &&
    blockSize === String(BLOCK_SIZE) &&
    parallelism === String(PARALLELISM);

  if (!hasAcceptedParameters || !salt || !key) {
    return null;
  }

  return { cost: Number(storedCost), salt: Buffer.from(salt, "base64url"), key: Buffer.from(key, "base64url") };
}
