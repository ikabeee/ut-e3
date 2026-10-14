import { hashPassword, verifyPassword } from "@features/auth/lib/server/auth-passwords";

describe("auth-passwords", () => {
  it("hashea y verifica una contraseña correctamente", () => {
    const raw = "MiPasswordSecreto123!";
    const hash = hashPassword(raw);

    expect(hash.length).toBeGreaterThan(0);
    expect(hash).toContain(":");
    expect(verifyPassword(raw, hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const raw = "MiPasswordSecreto123!";
    const hash = hashPassword(raw);

    expect(verifyPassword("IncorrectPassword", hash)).toBe(false);
  });

  it("rechaza hashes malformados o vacíos", () => {
    expect(verifyPassword("password", "")).toBe(false);
    expect(verifyPassword("password", "invalid_hash_without_salt")).toBe(false);
  });
});
