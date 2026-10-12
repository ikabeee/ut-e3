import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";

describe("buildAdminMetadata", () => {
  it("never lets search engines index the panel", () => {
    expect(buildAdminMetadata("home").robots).toEqual({ index: false, follow: false });
    expect(buildAdminMetadata("raffle").robots).toEqual({ index: false, follow: false });
  });

  it("names the section in the title", () => {
    expect(buildAdminMetadata("home").title).toBe("Panel de administración");
    expect(buildAdminMetadata("teams").title).toBe("Equipos · Panel de administración");
    expect(buildAdminMetadata("teams").alternates?.canonical).toBe("/admin/teams");
  });
});
