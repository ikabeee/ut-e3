import { render, screen } from "@testing-library/react";
import { LandingWordmark } from "@features/landing/components/landing-wordmark";

describe("LandingWordmark", () => {
  it("is announced as a single image named Videojuegos", () => {
    render(<LandingWordmark size="hero" />);

    expect(screen.getByRole("img", { name: "Videojuegos" })).toBeInTheDocument();
  });

  it("draws VIDE, JUEG and S around the two icons, all hidden from assistive technology", () => {
    const { container } = render(<LandingWordmark size="section" />);

    const parts = Array.from(container.querySelectorAll("span[aria-hidden='true']")).map((part) => part.textContent);
    const icons = Array.from(container.querySelectorAll("img")).map((icon) => icon.getAttribute("src"));

    expect(parts).toEqual(["VIDE", "JUEG", "S"]);
    expect(icons).toEqual(["/landing/icons/wordmark-plus.svg", "/landing/icons/wordmark-face.svg"]);
  });

  it("uses a different type size for each placement", () => {
    const sizes = (["hero", "section", "card"] as const).map((size) => {
      const { unmount } = render(<LandingWordmark size={size} />);
      const { className } = screen.getByRole("img", { name: "Videojuegos" });
      unmount();
      return className;
    });

    expect(new Set(sizes).size).toBe(3);
  });
});
