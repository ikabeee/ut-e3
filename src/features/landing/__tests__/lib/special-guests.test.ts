import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SPECIAL_GUESTS", () => {
  it("lists the two guest engineers with provisional content and unique ids", () => {
    expect(SPECIAL_GUESTS).toHaveLength(2);
    expect(new Set(SPECIAL_GUESTS.map((guest) => guest.id)).size).toBe(2);

    for (const guest of SPECIAL_GUESTS) {
      expect(guest).toMatchObject({ name: "Por anunciar", talk: "Plática por anunciar" });
    }
  });

  it("leaves the role empty until the real guests are announced", () => {
    for (const guest of SPECIAL_GUESTS) {
      expect(guest.role).toBeUndefined();
    }
  });
});
