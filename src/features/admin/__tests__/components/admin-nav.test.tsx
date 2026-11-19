import { render, screen } from "@testing-library/react";
import { AdminNav } from "@features/admin/components/admin-nav";

describe("AdminNav", () => {
  it("links the sysadmin to the KOF tournament and to the raffle panel (S5)", () => {
    render(<AdminNav currentPath="/admin/raffle" />);

    expect(screen.getByRole("link", { name: "Torneo de KOF" })).toHaveAttribute("href", "/admin/kof");
    expect(screen.getByRole("link", { name: "Rifa" })).toHaveAttribute("href", "/admin/raffle");
    expect(screen.getByRole("link", { name: "Rifa" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link")).toHaveLength(13);
  });
});
