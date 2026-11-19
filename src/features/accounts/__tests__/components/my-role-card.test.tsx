import { render, screen, within } from "@testing-library/react";
import { MyRoleCard } from "@features/accounts/components/my-role-card";
import type { MyRoleCard as MyRoleCardData } from "@features/accounts/lib/my-role";

const CARD: MyRoleCardData = {
  role: "stand_staff",
  title: "Staff de stand",
  summary: "Apoyas en el kiosko de tu stand.",
  steps: ["Pide el PIN al visitante.", "Revisa que el kiosko lo acepte."],
  screens: [{ href: "/stand/kiosk", label: "Kiosko del stand" }],
  placement: "Stand ZA-S1-E6-101",
  contact: "Acude a Rosa Pérez, administradora de tu stand.",
};

describe("MyRoleCard", () => {
  it("names the role and says in short what it does", () => {
    render(<MyRoleCard card={CARD} />);

    expect(screen.getByRole("heading", { level: 2, name: "Staff de stand" })).toBeInTheDocument();
    expect(screen.getByText("Apoyas en el kiosko de tu stand.")).toBeInTheDocument();
  });

  it("lists the steps in order", () => {
    render(<MyRoleCard card={CARD} />);

    const steps = within(screen.getByRole("list", { name: "Qué haces durante el evento" })).getAllByRole("listitem");

    expect(steps.map((step) => step.textContent)).toEqual(CARD.steps);
  });

  it("links the screens with a target of at least 44 px", () => {
    render(<MyRoleCard card={CARD} />);

    const link = within(screen.getByRole("navigation", { name: "Tus pantallas" })).getByRole("link", {
      name: "Kiosko del stand",
    });

    expect(link).toHaveAttribute("href", "/stand/kiosk");
    expect(link).toHaveClass("min-h-11");
  });

  it("shows where the role works and who to ask", () => {
    render(<MyRoleCard card={CARD} />);

    expect(screen.getByText("Stand ZA-S1-E6-101")).toBeInTheDocument();
    expect(screen.getByText("Acude a Rosa Pérez, administradora de tu stand.")).toBeInTheDocument();
  });

  it("leaves out the place when the role has none", () => {
    render(<MyRoleCard card={{ ...CARD, placement: null }} />);

    expect(screen.queryByText("Stand ZA-S1-E6-101")).not.toBeInTheDocument();
    expect(screen.queryByText("Dónde estás")).not.toBeInTheDocument();
  });
});
