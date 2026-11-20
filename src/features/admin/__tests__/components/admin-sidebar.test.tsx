import { render, screen, within } from "@testing-library/react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { AdminSidebar } from "@features/admin/components/admin-sidebar";

// The App Router hands the current path through this context; jest.mock is not allowed in this repository.
function atPath(pathname: string, children: ReactNode) {
  return <PathnameContext.Provider value={pathname}>{children}</PathnameContext.Provider>;
}

describe("AdminSidebar", () => {
  it("puts the sections in a sidebar, marking the section of the current path (S10)", () => {
    render(atPath("/admin/emails", <AdminSidebar />));

    const sidebar = screen.getByRole("complementary");
    const [, desktop] = within(sidebar).getAllByRole("navigation", { name: "Secciones del panel" });

    expect(within(desktop).getAllByRole("link")).toHaveLength(13);
    expect(within(desktop).getByRole("link", { name: "Correos" })).toHaveAttribute("aria-current", "page");
  });

  it("follows the path when the page changes, since the layout stays mounted", () => {
    const { rerender } = render(atPath("/admin/emails", <AdminSidebar />));

    rerender(atPath("/admin/kof", <AdminSidebar />));

    for (const nav of screen.getAllByRole("navigation", { name: "Secciones del panel" })) {
      const current = within(nav)
        .getAllByRole("link")
        .filter((link) => link.getAttribute("aria-current") === "page");

      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAccessibleName("Torneo de KOF");
    }
  });

  it("collapses the sections into a closed menu on a phone (S10)", () => {
    render(atPath("/admin/logs", <AdminSidebar />));

    const menu = screen.getByRole("group");

    expect(within(menu).getByText("Menú del panel").tagName).toBe("SUMMARY");
    expect(menu).not.toHaveAttribute("open");
    expect(within(menu).getAllByRole("link")).toHaveLength(13);
    expect(within(menu).getByRole("link", { name: "Logs" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the menu after a navigation", () => {
    const { rerender } = render(atPath("/admin/logs", <AdminSidebar />));

    screen.getByRole("group").setAttribute("open", "");
    rerender(atPath("/admin/sql", <AdminSidebar />));

    expect(screen.getByRole("group")).not.toHaveAttribute("open");
    expect(within(screen.getByRole("group")).getByRole("link", { name: "Consola SQL" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
