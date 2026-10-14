import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminShell } from "@features/admin/components/admin-shell";

describe("AdminShell", () => {
  it("renders sidebar with all sections and marks current section as active", () => {
    render(
      <AdminShell current="teams">
        <p>Contenido de equipos</p>
      </AdminShell>,
    );

    // Sidebar navigation
    expect(screen.getByRole("navigation", { name: "Secciones del panel" })).toBeInTheDocument();

    // Current section should be marked with aria-current="page"
    const activeLink = screen
      .getAllByRole("link", { name: /equipos/i })
      .find((el) => el.getAttribute("aria-current") === "page");
    expect(activeLink).toBeDefined();

    // "Ver sitio público" should NOT exist
    expect(screen.queryByText(/ver sitio público/i)).not.toBeInTheDocument();

    // Logout button exists
    expect(screen.getAllByRole("button", { name: /cerrar sesión/i })[0]).toBeInTheDocument();

    // Children rendered in main area
    expect(screen.getByText("Contenido de equipos")).toBeInTheDocument();
  });

  it("toggles mobile menu when toggle button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell current="home">
        <p>Contenido de resumen</p>
      </AdminShell>,
    );

    const toggleButton = screen.getByRole("button", { name: /abrir menú de navegación/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    await user.click(toggleButton);
    expect(screen.getByRole("button", { name: /cerrar menú/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("calls onLogout when logout button is clicked", async () => {
    const user = userEvent.setup();
    const handleLogout = jest.fn().mockResolvedValue({ ok: true, data: { redirectTo: "/login" } });

    render(
      <AdminShell current="home" onLogout={handleLogout}>
        <p>Contenido de resumen</p>
      </AdminShell>,
    );

    const logoutButtons = screen.getAllByRole("button", { name: /cerrar sesión/i });
    await user.click(logoutButtons[0]);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
