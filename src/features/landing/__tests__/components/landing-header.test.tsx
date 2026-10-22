import { render, screen } from "@testing-library/react";
import { LandingHeader } from "@features/landing/components/landing-header";

describe("LandingHeader", () => {
  it("links the brand to the home page", () => {
    render(<LandingHeader />);

    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "UTG, inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "UTG, inicio" })).toHaveTextContent("UTGAMES");
  });

  it("links each section of the landing", () => {
    render(<LandingHeader />);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Juegos" })).toHaveAttribute("href", "/#games");
    expect(screen.getByRole("link", { name: "Dinámicas" })).toHaveAttribute("href", "/#dynamics");
    expect(screen.getByRole("link", { name: "Programa" })).toHaveAttribute("href", "/#program");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
