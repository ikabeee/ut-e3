import { render, screen } from "@testing-library/react";
import { MyRoleCards } from "@features/accounts/components/my-role-cards";
import { buildMyRoleCards, type MyRoleContext } from "@features/accounts/lib/my-role";

const CONTEXT: MyRoleContext = {
  stand: { code: "ZA-S1-E6-101", gameName: "Make 'Em Fall", adminName: null },
  kofDesk: null,
  paths: { standGame: "/stand/game", standTeam: "/stand/team" },
};

describe("MyRoleCards", () => {
  it("shows one section for an account with one role and no note about two roles", () => {
    render(<MyRoleCards cards={buildMyRoleCards(["help_desk"], CONTEXT)} />);

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Atención" })).toBeInTheDocument();
    expect(screen.queryByText(/dos roles/)).not.toBeInTheDocument();
  });

  it("shows both roles of a dual-role account, the primary first, with the note", () => {
    render(<MyRoleCards cards={buildMyRoleCards(["stand_admin", "kof_admin"], CONTEXT)} />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(headings).toEqual(["Administrador de stand", "Administrador de KOF"]);
    expect(screen.getByText(/dos roles/)).toBeInTheDocument();
  });

  it("tells an account without a role of the app to ask the sysadmin", () => {
    render(<MyRoleCards cards={[]} />);

    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByText(/sysadmin/)).toBeInTheDocument();
  });
});
