import { render, screen } from "@testing-library/react";
import { StandAdminNav } from "@features/stands/components/stand-admin-nav";

describe("StandAdminNav", () => {
  it("links the kiosk, the game and the team of the stand", () => {
    render(<StandAdminNav />);

    const nav = screen.getByRole("navigation", { name: "Panel del stand" });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kiosko" })).toHaveAttribute("href", "/stand/kiosk");
    expect(screen.getByRole("link", { name: "Mi juego" })).toHaveAttribute("href", "/stand/game");
    expect(screen.getByRole("link", { name: "Mi equipo" })).toHaveAttribute("href", "/stand/team");
  });
});
