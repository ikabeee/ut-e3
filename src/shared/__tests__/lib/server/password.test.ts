/**
 * @jest-environment node
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  hashPassword,
  restorePasswordCostForTests,
  setPasswordCostForTests,
  verifyPassword,
} from "@shared/lib/server/password";

// jest.setup.ts lowers the cost for every suite; these tests check the real one, so they restore it.
beforeEach(restorePasswordCostForTests);

afterAll(setPasswordCostForTests);

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

  it("writes the production cost (N = 2^17, r = 8, p = 1) unless a test lowers it, and verifies it", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash.startsWith("scrypt$131072$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("writes the cheap cost once a test lowers it and still verifies production hashes", async () => {
    const production = await hashPassword("correct horse battery staple");

    setPasswordCostForTests();
    const cheap = await hashPassword("correct horse battery staple");

    expect(cheap.startsWith("scrypt$16$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", cheap)).toBe(true);
    expect(await verifyPassword("correct horse battery staple", production)).toBe(true);
  });

  it("rejects a cheap hash while the production cost is active", async () => {
    setPasswordCostForTests();
    const cheap = await hashPassword("correct horse battery staple");

    restorePasswordCostForTests();

    expect(await verifyPassword("correct horse battery staple", cheap)).toBe(false);
  });

  it("refuses to lower the cost outside a test environment", () => {
    const spy = jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });

    try {
      expect(setPasswordCostForTests).toThrow("only be lowered in tests");
    } finally {
      spy.restore();
    }
  });

  it("is not called by any code that ships: only jest.setup.ts and the tests use it", () => {
    const callers = ["src", "prisma", "e2e"].flatMap((root) =>
      readdirSync(root, { recursive: true, encoding: "utf8" })
        .map((file) => path.join(root, file))
        .filter(
          (file) => /\.(tsx?|mjs)$/.test(file) && !file.includes("__tests__") && !file.endsWith("server/password.ts"),
        )
        .filter((file) => readFileSync(file, "utf8").includes("setPasswordCostForTests")),
    );

    expect(callers).toEqual([]);
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
