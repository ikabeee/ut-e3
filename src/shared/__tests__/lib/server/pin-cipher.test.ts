/**
 * @jest-environment node
 */
import { decryptPin, encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";

const ORIGINAL_KEY = process.env.PIN_ENCRYPTION_KEY;

const VALID_KEY = Buffer.alloc(32, 1).toString("base64");

const SIXTEEN_BYTE_KEY = Buffer.alloc(16, 1).toString("base64");

beforeEach(() => {
  process.env.PIN_ENCRYPTION_KEY = VALID_KEY;
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.PIN_ENCRYPTION_KEY;
  } else {
    process.env.PIN_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

describe("pin-cipher", () => {
  it("encrypts and decrypts valid 5-digit PINs across the range", () => {
    const pins = ["00000", "04217", "99999"];

    for (const pin of pins) {
      const encrypted = encryptPin(pin);

      expect(decryptPin(encrypted)).toBe(pin);
    }
  });

  it("produces distinct ciphertexts using a random IV and does not leak the plain PIN", () => {
    const pin = "04217";
    const first = encryptPin(pin);
    const second = encryptPin(pin);

    expect(first).not.toBe(second);
    expect(first).not.toContain(pin);
    expect(second).not.toContain(pin);
  });

  it("produces a deterministic hex HMAC hash for lookup", () => {
    const pin = "04217";
    const differentPin = "04218";

    const firstHash = hashPinForLookup(pin);
    const secondHash = hashPinForLookup(pin);
    const differentHash = hashPinForLookup(differentPin);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toBe(differentHash);
    expect(firstHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws when decrypting a tampered ciphertext or malformed payload", () => {
    const valid = encryptPin("04217");
    const tampered = valid.slice(0, -2) + (valid.endsWith("A") ? "B" : "A") + valid.slice(-1);

    expect(() => decryptPin(tampered)).toThrow();
    expect(() => decryptPin("malformed-payload")).toThrow();
  });

  it("throws a Spanish error message naming PIN_ENCRYPTION_KEY and openssl when the key is missing", () => {
    delete process.env.PIN_ENCRYPTION_KEY;

    expect(() => encryptPin("04217")).toThrow(/PIN_ENCRYPTION_KEY/);
    expect(() => encryptPin("04217")).toThrow(/openssl rand -base64 32/);
  });

  it("throws a Spanish error message naming PIN_ENCRYPTION_KEY and openssl when the key is 16 bytes", () => {
    process.env.PIN_ENCRYPTION_KEY = SIXTEEN_BYTE_KEY;

    expect(() => encryptPin("04217")).toThrow(/PIN_ENCRYPTION_KEY/);
    expect(() => encryptPin("04217")).toThrow(/openssl rand -base64 32/);
  });
});
