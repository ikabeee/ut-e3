import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextJest from "next/jest.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const createJestConfig = nextJest({ dir: rootDir });

function aliasesFromTsconfig() {
  const tsconfig = JSON.parse(readFileSync(path.join(rootDir, "tsconfig.json"), "utf8"));
  const paths = tsconfig.compilerOptions?.paths ?? {};

  return Object.fromEntries(
    Object.entries(paths).map(([alias, [target]]) => [
      `^${alias.replace("/*", "/(.*)")}$`,
      `<rootDir>/${target.replace("./", "").replace("/*", "/$1")}`,
    ]),
  );
}

const config = {
  rootDir,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: aliasesFromTsconfig(),
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/__tests__/**"],
  coverageReporters: ["text-summary", "lcov"],
};

const esmPackages = ["@heroui", "tailwind-variants", "tailwind-merge"].join("|");

export default async function jestConfig() {
  const nextConfig = await createJestConfig(config)();

  return {
    ...nextConfig,
    transformIgnorePatterns: [
      `/node_modules/(?!(${esmPackages})/)`,
      ...nextConfig.transformIgnorePatterns.filter((pattern) => !pattern.startsWith("/node_modules")),
    ],
  };
}
