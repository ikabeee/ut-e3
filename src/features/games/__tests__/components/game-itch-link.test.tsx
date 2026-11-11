import { render, screen } from "@testing-library/react";
import { GameItchLink } from "@features/games/components/game-itch-link";

describe("GameItchLink", () => {
  it("announces the activation time in Cancun without a link while pending", () => {
    render(<GameItchLink link={{ status: "pending", opensAt: "2026-11-20T21:30:00.000Z" }} />);

    expect(screen.getByText("El enlace a itch.io se activa a las 16:30.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links to itch.io in a new tab once open", () => {
    render(<GameItchLink link={{ status: "open", url: "https://utg.itch.io/ceniza-protocol" }} />);

    const link = screen.getByRole("link", { name: /Jugar en itch\.io/ });

    expect(link).toHaveAttribute("href", "https://utg.itch.io/ceniza-protocol");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders nothing for a game without a link", () => {
    const { container } = render(<GameItchLink link={{ status: "hidden" }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
