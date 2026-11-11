import { render, screen } from "@testing-library/react";
import { LedWordmark } from "@features/landing/components/led-wordmark";

describe("LedWordmark", () => {
  it("is one SVG image named after the event", () => {
    render(<LedWordmark text="PIXEL & CODE" label="PIXEL & CODE" />);

    const wordmark = screen.getByRole("img", { name: "PIXEL & CODE" });

    expect(wordmark.tagName.toLowerCase()).toBe("svg");
    expect(wordmark).toHaveAttribute("aria-label", "PIXEL & CODE");
  });

  it("draws the lit cells of the text", () => {
    const { container } = render(<LedWordmark text="I" label="I" />);

    expect(container.querySelectorAll("svg rect")).toHaveLength(11);
  });
});
