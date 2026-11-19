import { render, screen, within } from "@testing-library/react";
import { AdminHeader } from "@features/admin/components/admin-header";

const signOutAction = async () => {};

describe("AdminHeader", () => {
  it("shows the title, the session and the sign out button", () => {
    render(<AdminHeader title="Cuentas" signedInAs="Sesión de Ana" currentPath={null} signOutAction={signOutAction} />);

    expect(screen.getByRole("heading", { name: "Cuentas" })).toBeInTheDocument();
    expect(screen.getByText("Sesión de Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("links to the page of the role next to the sign out button, with or without sections", () => {
    const { rerender } = render(
      <AdminHeader title="Cuentas" signedInAs="Sesión de Ana" currentPath={null} signOutAction={signOutAction} />,
    );

    expect(screen.getByRole("link", { name: "Mi rol" })).toHaveAttribute("href", "/my-role");

    rerender(
      <AdminHeader title="Logs" signedInAs="Sesión de Ana" currentPath="/admin/logs" signOutAction={signOutAction} />,
    );

    expect(screen.getByRole("link", { name: "Mi rol" })).toHaveAttribute("href", "/my-role");
  });

  it("collapses the sections into a menu that opens the same list as the sidebar (S10)", () => {
    render(
      <AdminHeader title="Logs" signedInAs="Sesión de Ana" currentPath="/admin/logs" signOutAction={signOutAction} />,
    );

    const menu = screen.getByRole("group");
    const summary = within(menu).getByText("Menú del panel");

    expect(summary.tagName).toBe("SUMMARY");
    expect(menu).not.toHaveAttribute("open");
    expect(within(menu).getAllByRole("link")).toHaveLength(13);
    expect(within(menu).getByRole("link", { name: "Logs" })).toHaveAttribute("aria-current", "page");
    expect(within(menu).getByRole("link", { name: "Rifa" })).toHaveAttribute("href", "/admin/raffle");
  });

  it("has no menu for an account without sections", () => {
    render(<AdminHeader title="Torneo" signedInAs="Sesión de Ana" currentPath={null} signOutAction={signOutAction} />);

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Mi rol" })).toBeInTheDocument();
  });
});
