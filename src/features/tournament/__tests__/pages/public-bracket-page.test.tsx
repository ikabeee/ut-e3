import { publicBracketPageMetadata } from "@features/tournament/pages/public-bracket-page";

describe("public bracket page metadata (S33)", () => {
  it("is titled Tabla de posiciones and keeps its canonical path", () => {
    expect(publicBracketPageMetadata.title).toBe("Tabla de posiciones");
    expect(publicBracketPageMetadata.alternates?.canonical).toBe("/tournament");
  });
});
