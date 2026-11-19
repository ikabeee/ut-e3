import { render, screen, within } from "@testing-library/react";
import { AdminNav } from "@features/admin/components/admin-nav";

describe("AdminNav", () => {
  it("links the sysadmin to the KOF tournament and to the raffle panel (S5)", () => {
    render(<AdminNav currentPath="/admin/raffle" />);

    expect(screen.getByRole("link", { name: "Torneo de KOF" })).toHaveAttribute("href", "/admin/kof");
    expect(screen.getByRole("link", { name: "Rifa" })).toHaveAttribute("href", "/admin/raffle");
    expect(screen.getAllByRole("link")).toHaveLength(13);
  });

  it("marks only the current section for assistive technology (S10)", () => {
    render(<AdminNav currentPath="/admin/logs" />);

    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Logs");
  });

  it("shows an icon next to the text of every section, hidden from assistive technology (S10)", () => {
    render(<AdminNav currentPath="/admin" />);

    for (const link of screen.getAllByRole("link")) {
      const icon = link.querySelector("svg");

      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(within(link).getByText(link.textContent ?? "")).toBeInTheDocument();
    }
  });

  it("lists the sections inside a labelled navigation", () => {
    render(<AdminNav currentPath="/admin" />);

    expect(
      within(screen.getByRole("navigation", { name: "Secciones del panel" })).getAllByRole("listitem"),
    ).toHaveLength(13);
  });
});
