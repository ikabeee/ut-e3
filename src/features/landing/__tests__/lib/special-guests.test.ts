import { existsSync } from "node:fs";
import { join } from "node:path";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SPECIAL_GUESTS", () => {
  it("lists the two guests with their names and the talk still to be announced", () => {
    expect(SPECIAL_GUESTS).toHaveLength(2);
    expect(SPECIAL_GUESTS[0]).toMatchObject({
      id: "guest-1",
      name: "Ing. Ariana Patricia Tzuc Vázquez",
      talk: "Plática por anunciar",
    });
    expect(SPECIAL_GUESTS[1]).toEqual({
      id: "guest-noxy",
      name: "Ing. Noelí Rodríguez Morales",
      talk: "Plática por anunciar",
      photo: { src: "/speakers/ponente-noxy.webp", alt: "Retrato de Ing. Noelí Rodríguez Morales" },
    });
  });

  it("gives the first guest a photo that exists in public/ and its alt", () => {
    const photo = SPECIAL_GUESTS[0]?.photo;

    expect(photo?.src).toBe("/speakers/ponente-1.webp");
    expect(photo?.alt).toBe("Retrato de Ing. Ariana Patricia Tzuc Vázquez");
    expect(existsSync(join(process.cwd(), "public", photo?.src ?? ""))).toBe(true);
  });

  it("gives the Noxy Digital speaker a photo that exists in public/", () => {
    const photo = SPECIAL_GUESTS[1]?.photo;

    expect(existsSync(join(process.cwd(), "public", photo?.src ?? ""))).toBe(true);
  });

  it("leaves the role empty until the real guests are announced", () => {
    for (const guest of SPECIAL_GUESTS) {
      expect(guest.role).toBeUndefined();
    }
  });
});
