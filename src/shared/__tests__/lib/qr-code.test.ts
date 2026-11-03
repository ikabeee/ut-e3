import { encodeWithQuietZone, readMatrixFromPath } from "@shared/__tests__/lib/qr-test-utils";
import { buildQrCode } from "@shared/lib/qr-code";

const LINK = "https://showcase.example/passport/claim/8f3kQ2mZ-1x_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345";

describe("buildQrCode", () => {
  it("draws exactly the modules that the encoder gives for the link, with 4 modules of quiet zone", () => {
    const qr = buildQrCode(LINK);

    expect(readMatrixFromPath(qr.path, qr.size)).toEqual(encodeWithQuietZone(LINK));
  });

  it("is a square of the version of the code plus the quiet zone on each side", () => {
    const { size } = buildQrCode(LINK);

    // A QR code of version v has 17 + 4v modules per side.
    expect((size - 8 - 17) % 4).toBe(0);
    expect(size).toBeGreaterThan(8 + 21);
  });

  it("changes with the text: another link is another code", () => {
    expect(buildQrCode(`${LINK}x`).path).not.toBe(buildQrCode(LINK).path);
  });

  it("gives the same code for the same text", () => {
    expect(buildQrCode(LINK)).toEqual(buildQrCode(LINK));
  });

  it("leaves the quiet zone white", () => {
    const { path, size } = buildQrCode(LINK);
    const matrix = readMatrixFromPath(path, size);

    expect(matrix.slice(0, 4).flat().some(Boolean)).toBe(false);
    expect(matrix.slice(-4).flat().some(Boolean)).toBe(false);
    expect(matrix.every((row) => !row.slice(0, 4).some(Boolean) && !row.slice(-4).some(Boolean))).toBe(true);
  });

  it("joins the dark modules of a row into runs, so the path stays small", () => {
    const { path } = buildQrCode(LINK);
    const runs = [...path.matchAll(/h(\d+)v1/g)].map((match) => Number(match[1]));

    expect(Math.max(...runs)).toBeGreaterThan(1);
  });
});
