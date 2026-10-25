import { render, screen } from "@testing-library/react";
import { MarketplaceCard } from "@features/landing/components/marketplace-card";

const CLOSED_TEXT = "Registro de vendedores cerrado";

describe("MarketplaceCard", () => {
  it("links to the form in a new tab when registration is open", () => {
    render(<MarketplaceCard registration={{ status: "open", formUrl: "https://forms.gle/marketplace" }} />);

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "https://forms.gle/marketplace");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText(CLOSED_TEXT)).not.toBeInTheDocument();
  });

  it("shows the closed notice and no link once registration is closed", () => {
    render(<MarketplaceCard registration={{ status: "closed" }} />);

    expect(screen.getByText(CLOSED_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows no link while the form is unannounced", () => {
    render(<MarketplaceCard registration={{ status: "unannounced" }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(CLOSED_TEXT)).not.toBeInTheDocument();
  });
});
