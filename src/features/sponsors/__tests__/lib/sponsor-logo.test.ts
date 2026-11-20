import {
  buildGarbage,
  buildJpeg,
  buildPng,
  buildSvg,
  buildWebp,
  padTo,
} from "@features/sponsors/__tests__/lib/logo-fixture";
import {
  buildSponsorLogoFileName,
  buildSponsorLogoUrl,
  isSponsorLogoFileName,
  LOGO_MAX_DIMENSION,
  readLogoImageInfo,
  readSponsorLogoFileName,
} from "@features/sponsors/lib/sponsor-logo";

describe("readLogoImageInfo (S3: the format comes from the bytes)", () => {
  it("reads a PNG, a JPEG and the three kinds of WebP, with their size", () => {
    expect(readLogoImageInfo(buildPng({ width: 400, height: 200 }))).toEqual({
      extension: "png",
      width: 400,
      height: 200,
    });
    expect(readLogoImageInfo(buildJpeg({ width: 300, height: 120 }))).toEqual({
      extension: "jpg",
      width: 300,
      height: 120,
    });
    expect(readLogoImageInfo(buildWebp({ width: 640, height: 480, kind: "lossy" }))).toEqual({
      extension: "webp",
      width: 640,
      height: 480,
    });
    expect(readLogoImageInfo(buildWebp({ width: 641, height: 481, kind: "lossless" }))).toEqual({
      extension: "webp",
      width: 641,
      height: 481,
    });
    expect(readLogoImageInfo(buildWebp({ width: 1000, height: 999, kind: "extended" }))).toEqual({
      extension: "webp",
      width: 1000,
      height: 999,
    });
  });

  it("refuses an SVG, garbage, an empty file and a file that was cut", () => {
    expect(readLogoImageInfo(buildSvg())).toBeNull();
    expect(readLogoImageInfo(buildGarbage())).toBeNull();
    expect(readLogoImageInfo(new Uint8Array())).toBeNull();
    expect(readLogoImageInfo(buildPng({ width: 10, height: 10, hasEnd: false }))).toBeNull();
    expect(readLogoImageInfo(buildPng({ width: 10, height: 10 }).subarray(0, 20))).toBeNull();
    expect(readLogoImageInfo(buildJpeg({ width: 10, height: 10, hasEnd: false }))).toBeNull();
    expect(readLogoImageInfo(buildWebp({ width: 10, height: 10 }).subarray(0, 18))).toBeNull();
  });

  it("refuses a RIFF container that is not WebP and a WebP whose first chunk is unknown", () => {
    const wave = buildWebp({ width: 10, height: 10 });

    wave.set([0x57, 0x41, 0x56, 0x45], 8);

    const unknown = buildWebp({ width: 10, height: 10 });

    unknown.set([0x4a, 0x55, 0x4e, 0x4b], 12);

    expect(readLogoImageInfo(wave)).toBeNull();
    expect(readLogoImageInfo(unknown)).toBeNull();
  });

  it("refuses a size of zero and one over the limit, and accepts exactly the limit", () => {
    expect(readLogoImageInfo(buildPng({ width: 0, height: 10 }))).toBeNull();
    expect(readLogoImageInfo(buildPng({ width: LOGO_MAX_DIMENSION + 1, height: 10 }))).toBeNull();
    expect(readLogoImageInfo(buildPng({ width: 10, height: LOGO_MAX_DIMENSION + 1 }))).toBeNull();
    expect(readLogoImageInfo(buildPng({ width: LOGO_MAX_DIMENSION, height: LOGO_MAX_DIMENSION }))).toMatchObject({
      extension: "png",
    });
  });

  it("does not trust trailing bytes for the format", () => {
    expect(readLogoImageInfo(padTo(buildSvg(), 200))).toBeNull();
  });
});

describe("sponsor logo names", () => {
  it("builds the name and the URL that the app writes, and recognizes them", () => {
    const fileName = buildSponsorLogoFileName("nodo-caribe", "0123456789ab", "png");

    expect(fileName).toBe("sponsor-nodo-caribe-0123456789ab.png");
    expect(isSponsorLogoFileName(fileName)).toBe(true);
    expect(buildSponsorLogoUrl(fileName)).toBe("/api/media/sponsors/sponsor-nodo-caribe-0123456789ab.png");
    expect(readSponsorLogoFileName(buildSponsorLogoUrl(fileName))).toBe(fileName);
  });

  it.each([
    "../sponsor-a-0123456789ab.png",
    "sponsor-a-0123456789ab.svg",
    "sponsor-a-0123456789ab.PNG",
    "sponsor-a-0123456789AB.png",
    "sponsor-a-0123456789a.png",
    "sponsor--0123456789ab.png",
    "sponsor-a--b-0123456789ab.png",
    "sponsor-a-0123456789ab.png.jpg",
    "other-a-0123456789ab.png",
    "sponsor-a/b-0123456789ab.png",
    "",
  ])("does not recognize %s", (fileName) => {
    expect(isSponsorLogoFileName(fileName)).toBe(false);
  });

  it("reads no name from a path of public/ or from another media folder", () => {
    expect(readSponsorLogoFileName("/sponsors/bonavida.svg")).toBeNull();
    expect(readSponsorLogoFileName("/api/media/games/sponsor-a-0123456789ab.png")).toBeNull();
    expect(readSponsorLogoFileName("/api/media/sponsors/../x.png")).toBeNull();
  });
});
