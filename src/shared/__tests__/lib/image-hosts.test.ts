import { isAllowedImageUrl, parseImageHosts } from "@shared/lib/image-hosts";

describe("image hosts", () => {
  it("parses the comma separated list", () => {
    expect(parseImageHosts(" img.itch.zone, UTG.blob.vercel-storage.com ,,")).toEqual([
      "img.itch.zone",
      "utg.blob.vercel-storage.com",
    ]);
    expect(parseImageHosts(undefined)).toEqual([]);
  });

  it("allows site paths and https URLs of the listed hosts only", () => {
    const hosts = ["img.itch.zone"];

    expect(isAllowedImageUrl("/games/ruta-9.jpg", hosts)).toBe(true);
    expect(isAllowedImageUrl("https://img.itch.zone/a.png", hosts)).toBe(true);
    expect(isAllowedImageUrl("data:image/png;base64,AAAA", hosts)).toBe(false);
    expect(isAllowedImageUrl("https://evil.example/a.png", hosts)).toBe(false);
    expect(isAllowedImageUrl("//img.itch.zone/a.png", hosts)).toBe(false);
    expect(isAllowedImageUrl("javascript:alert(1)", hosts)).toBe(false);
  });
});
