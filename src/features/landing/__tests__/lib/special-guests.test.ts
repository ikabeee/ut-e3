import { existsSync } from "node:fs";
import { join } from "node:path";
import { PENDING_NOXY_SPEAKER, SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SPECIAL_GUESTS", () => {
  it("lists the first guest with her name and a second guest still to be announced, without photo", () => {
    expect(SPECIAL_GUESTS).toHaveLength(2);
    expect(SPECIAL_GUESTS[0]).toMatchObject({
      id: "guest-1",
      name: "Ing. Ariana Patricia Tzuc Vázquez",
      talk: "Plática por anunciar",
    });
    expect(SPECIAL_GUESTS[1]).toEqual({ id: "guest-2", name: "Por anunciar", talk: "Plática por anunciar" });
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

describe("PENDING_NOXY_SPEAKER", () => {
  it("has its photo in public/ but no name, role or talk yet, and no page shows it", () => {
    expect(PENDING_NOXY_SPEAKER).toMatchObject({ name: "", talk: "" });
    expect(PENDING_NOXY_SPEAKER.role).toBeUndefined();
    expect(existsSync(join(process.cwd(), "public", PENDING_NOXY_SPEAKER.photo?.src ?? ""))).toBe(true);
    expect(SPECIAL_GUESTS).not.toContain(PENDING_NOXY_SPEAKER);
  });
});
