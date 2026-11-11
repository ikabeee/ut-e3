import { existsSync } from "node:fs";
import { join } from "node:path";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SPECIAL_GUESTS", () => {
  it("lists only the first guest, with her name and the talk still to be announced, until the second one is announced", () => {
    expect(SPECIAL_GUESTS).toHaveLength(1);
    expect(SPECIAL_GUESTS[0]).toMatchObject({
      id: "guest-1",
      name: "Ing. Ariana Patricia Tzuc Vázquez",
      talk: "Plática por anunciar",
    });
  });

  it("gives the first guest a photo that exists in public/ and its alt", () => {
    const photo = SPECIAL_GUESTS[0]?.photo;

    expect(photo?.src).toBe("/speakers/ponente-1.webp");
    expect(photo?.alt).toBe("Retrato de Ing. Ariana Patricia Tzuc Vázquez");
    expect(existsSync(join(process.cwd(), "public", photo?.src ?? ""))).toBe(true);
  });

  it("leaves the role empty until the real guests are announced", () => {
    for (const guest of SPECIAL_GUESTS) {
      expect(guest.role).toBeUndefined();
    }
  });
});
