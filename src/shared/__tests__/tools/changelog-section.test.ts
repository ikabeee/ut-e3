import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "tools/release/changelog-section.mjs");

const CHANGELOG = `# Changelog

## [Sin publicar]

## [1.5.0] - 2026-11-19

### Agregado

- Cosa nueva de 1.5.0.

## [1.4.0-rc] - 2026-11-18

- Candidata de 1.4.0.

## [1.4.0] - 2026-11-17

### Cambiado

- Cambio de 1.4.0.

## [0.1.0]

- Primera versión.
`;

let workDir: string;

let changelogPath: string;

beforeAll(() => {
  workDir = mkdtempSync(path.join(tmpdir(), "changelog-section-"));
  changelogPath = path.join(workDir, "CHANGELOG.md");

  writeFileSync(changelogPath, CHANGELOG);
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function runScript(version: string) {
  const result = spawnSync(process.execPath, [SCRIPT, version, changelogPath], { encoding: "utf8" });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("changelog-section", () => {
  it("imprime una sección intermedia hasta la siguiente", () => {
    const result = runScript("1.5.0");

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("### Agregado\n\n- Cosa nueva de 1.5.0.\n");
  });

  it("imprime la última sección hasta el final del archivo", () => {
    const result = runScript("0.1.0");

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("- Primera versión.\n");
  });

  it("no incluye la línea del encabezado", () => {
    const result = runScript("1.4.0");

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("## [");
    expect(result.stdout).not.toContain("2026-11-17");
  });

  it("no confunde 1.4.0 con 1.4.0-rc", () => {
    const result = runScript("1.4.0");

    expect(result.stdout).toBe("### Cambiado\n\n- Cambio de 1.4.0.\n");
    expect(result.stdout).not.toContain("Candidata");
  });

  it("termina con 1 si la versión no existe", () => {
    const result = runScript("9.9.9");

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain('"## [9.9.9]"');
  });

  it("termina con 1 si la sección está vacía", () => {
    const result = runScript("Sin publicar");

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
  });
});
