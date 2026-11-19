import { ADMIN_NAV_ITEMS } from "@features/admin/lib/admin-nav-items";

describe("ADMIN_NAV_ITEMS", () => {
  it("lists every section of the panel with its path and label, in the order of the panel (S10)", () => {
    expect(ADMIN_NAV_ITEMS.map((item) => [item.href, item.label])).toEqual([
      ["/admin", "Cuentas y stands"],
      ["/admin/settings", "Configuración"],
      ["/admin/moderation", "Moderación"],
      ["/admin/visitors", "Visitantes"],
      ["/admin/catalog", "Catálogos"],
      ["/admin/server", "Servidor"],
      ["/admin/accounts", "Cuentas del staff"],
      ["/admin/emails", "Correos"],
      ["/admin/sql", "Consola SQL"],
      ["/admin/logs", "Logs"],
      ["/admin/recovery", "Recuperación"],
      ["/admin/kof", "Torneo de KOF"],
      ["/admin/raffle", "Rifa"],
    ]);
  });

  it("gives each section its own icon", () => {
    const icons = ADMIN_NAV_ITEMS.map((item) => item.icon);

    expect(new Set(icons).size).toBe(ADMIN_NAV_ITEMS.length);
  });
});
