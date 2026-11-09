import { buildMarqueeText } from "@features/showcase/lib/marquee-text";

describe("buildMarqueeText", () => {
  it("joins the words in upper case and ends with a dash", () => {
    expect(buildMarqueeText("Entrada", "libre")).toBe("ENTRADA LIBRE -");
  });
});
