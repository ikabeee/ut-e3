import { buildQrCode } from "@shared/lib/qr-code";

describe("buildQrCode", () => {
  const url = "https://utg.example/v/0123456789abcdef0123456789abcdef";

  it("draws the modules of the code as one SVG path", () => {
    const { size, path } = buildQrCode(url);

    // 54 caracteres con corrección "M" caben en la versión 4: 33 módulos por lado.
    expect(size).toBe(33);
    // El patrón de posición de la esquina superior izquierda: 7 módulos oscuros seguidos.
    expect(path.startsWith("M0 0h7v1h-7z")).toBe(true);
  });

  it("is deterministic", () => {
    expect(buildQrCode(url)).toEqual(buildQrCode(url));
  });
});
