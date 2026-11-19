import { render, screen } from "@testing-library/react";
import { AdminSectionView, AdminSidebarLayout } from "@features/admin/components/admin-sidebar";

const signOutAction = async () => {};

describe("AdminSidebarLayout", () => {
  it("puts the sections in a sidebar beside the content, with the current one marked (S10)", () => {
    render(
      <AdminSidebarLayout currentPath="/admin/emails">
        <p>Contenido de la sección</p>
      </AdminSidebarLayout>,
    );

    const sidebar = screen.getByRole("complementary");

    expect(sidebar).toContainElement(screen.getByRole("navigation", { name: "Secciones del panel" }));
    expect(screen.getAllByRole("link")).toHaveLength(13);
    expect(screen.getByRole("link", { name: "Correos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Contenido de la sección")).toBeInTheDocument();
    expect(sidebar).not.toContainElement(screen.getByText("Contenido de la sección"));
  });

  it("shows only the content for an account without sections, like the KOF desks", () => {
    render(
      <AdminSidebarLayout currentPath={null}>
        <p>Contenido de la sección</p>
      </AdminSidebarLayout>,
    );

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Contenido de la sección")).toBeInTheDocument();
  });
});

describe("AdminSectionView", () => {
  it("renders the sidebar, the header and the content of the section (S10)", () => {
    render(
      <AdminSectionView
        title="Logs"
        signedInAs="Sesión de Ana"
        path="/admin/logs"
        areaLink={null}
        signOutAction={signOutAction}
      >
        <p>Contenido de la sección</p>
      </AdminSectionView>,
    );

    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Logs" })).toBeInTheDocument();
    expect(screen.getByText("Contenido de la sección")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Cambiar de área" })).not.toBeInTheDocument();
  });

  it("renders the link back to the stand for an account with a second role (S1)", () => {
    render(
      <AdminSectionView
        title="Logs"
        signedInAs="Sesión de Ana"
        path="/admin/logs"
        areaLink={{ href: "/stand/kiosk", label: "Ir a mi stand" }}
        signOutAction={signOutAction}
      >
        <p>Contenido de la sección</p>
      </AdminSectionView>,
    );

    const nav = screen.getByRole("navigation", { name: "Cambiar de área" });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a mi stand" })).toHaveAttribute("href", "/stand/kiosk");
  });
});
