/**
 * @jest-environment node
 */
import { hashPassword, verifyPassword } from "@shared/lib/server/password";

describe("hashPassword and verifyPassword", () => {
  it("accepts the password that produced the hash and rejects any other", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("correct horse battery stapler", hash)).toBe(false);
  });

  it("stores scrypt with its parameters and a fresh salt, never the password", async () => {
    const first = await hashPassword("correct horse battery staple");
    const second = await hashPassword("correct horse battery staple");

    expect(first).toMatch(/^scrypt\$131072\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(first).not.toContain("correct horse");
    expect(first).not.toBe(second);
  });

  it("rejects a stored value that is not a scrypt hash", async () => {
    expect(await verifyPassword("anything", "plain-text")).toBe(false);
  });

  it("rejects, without throwing, a stored hash whose parameters differ from the ones it writes", async () => {
    const [, , , , salt, key] = (await hashPassword("anything")).split("$");

    expect(await verifyPassword("anything", ["scrypt", 0, 8, 1, salt, key].join("$"))).toBe(false);
    expect(await verifyPassword("anything", ["scrypt", 2 ** 30, 8, 1, salt, key].join("$"))).toBe(false);
  });
});
