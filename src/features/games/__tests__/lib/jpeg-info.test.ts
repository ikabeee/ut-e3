import { readJpegInfo } from "@features/games/lib/jpeg-info";
import { buildJpeg } from "@features/games/__tests__/lib/jpeg-fixture";

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

describe("readJpegInfo", () => {
  it("reads the size and the components from the frame header", () => {
    expect(readJpegInfo(buildJpeg({ width: 1920, height: 1080 }))).toEqual({
      width: 1920,
      height: 1080,
      components: 3,
    });
    expect(readJpegInfo(buildJpeg({ width: 810, height: 1080, components: 1 }))).toEqual({
      width: 810,
      height: 1080,
      components: 1,
    });
  });

  it("finds the frame after other segments", () => {
    expect(readJpegInfo(buildJpeg({ width: 810, height: 1080, paddingSegments: 3 }))).toMatchObject({ width: 810 });
  });

  it("answers null for what is not a JPEG, even with a renamed extension", () => {
    expect(readJpegInfo(PNG_SIGNATURE)).toBeNull();
    expect(readJpegInfo(new TextEncoder().encode("RIFF....WEBPVP8 "))).toBeNull();
    expect(readJpegInfo(new Uint8Array())).toBeNull();
  });

  it("answers null for a JPEG that is cut before its end marker or its frame header", () => {
    expect(readJpegInfo(buildJpeg({ width: 1920, height: 1080, hasEnd: false }))).toBeNull();
    expect(readJpegInfo(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    expect(readJpegInfo(Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0x00]))).toBeNull();
  });

  it("answers null for a frame without size", () => {
    expect(readJpegInfo(buildJpeg({ width: 0, height: 1080 }))).toBeNull();
  });
});
