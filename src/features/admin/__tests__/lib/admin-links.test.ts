import { ADMIN_SECTION_PATHS, isAdminPath } from "@features/admin/lib/admin-links";

describe("isAdminPath", () => {
  it("matches the panel and its sections", () => {
    for (const path of Object.values(ADMIN_SECTION_PATHS)) {
      expect(isAdminPath(path)).toBe(true);
    }
  });

  it("ignores other routes that start with the same letters", () => {
    expect(isAdminPath("/administration")).toBe(false);
    expect(isAdminPath("/games/admin")).toBe(false);
  });
});
