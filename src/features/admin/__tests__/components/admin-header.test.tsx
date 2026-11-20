import { render, screen } from "@testing-library/react";
import { AdminHeader } from "@features/admin/components/admin-header";

const signOutAction = async () => {};

describe("AdminHeader", () => {
  it("shows the title, the session, the page of the role and the sign out button", () => {
    render(<AdminHeader title="Cuentas" signedInAs="Sesión de Ana" areaLink={null} signOutAction={signOutAction} />);

    expect(screen.getByRole("heading", { name: "Cuentas" })).toBeInTheDocument();
    expect(screen.getByText("Sesión de Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mi rol" })).toHaveAttribute("href", "/my-role");
  });

  it("leaves the sections to the layout of the panel: the page draws no menu nor sidebar (S10)", () => {
    render(<AdminHeader title="Logs" signedInAs="Sesión de Ana" areaLink={null} signOutAction={signOutAction} />);

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Secciones del panel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Cambiar de área" })).not.toBeInTheDocument();
  });

  it("links back to the stand for an account with a second role (S1)", () => {
    render(
      <AdminHeader
        title="Logs"
        signedInAs="Sesión de Ana"
        areaLink={{ href: "/stand/kiosk", label: "Ir a mi stand" }}
        signOutAction={signOutAction}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Cambiar de área" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a mi stand" })).toHaveAttribute("href", "/stand/kiosk");
  });
});
