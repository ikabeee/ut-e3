import { splitEventTitle } from "@features/showcase/lib/event-title";

describe("splitEventTitle", () => {
  it("splits the event name at its first space", () => {
    expect(splitEventTitle("PIXEL & CODE")).toEqual({ firstLine: "PIXEL", secondLine: "& CODE" });
  });

  it("keeps a one-word name in the first line", () => {
    expect(splitEventTitle(" PIXEL ")).toEqual({ firstLine: "PIXEL", secondLine: "" });
  });
});
