import { maskEmail } from "@shared/lib/mask-email";

describe("maskEmail", () => {
  it("keeps two letters and the domain", () => {
    expect(maskEmail("carlos@gmail.com")).toBe("ca***@gmail.com");
  });

  it("keeps one letter of a short name so the address cannot be guessed", () => {
    expect(maskEmail("ana@uc.mx")).toBe("a***@uc.mx");
  });

  it("hides everything when it is not an address", () => {
    expect(maskEmail("nothing")).toBe("***");
    expect(maskEmail("@x.com")).toBe("***");
  });
});
