import { buildPrecacheRoutes } from "@features/offline/lib/precache-routes";

describe("buildPrecacheRoutes", () => {
  it("includes the main sections, the offline page and every game detail", () => {
    expect(buildPrecacheRoutes(["ruta-9", "cenote"])).toEqual([
      "/",
      "/games",
      "/floor-plan",
      "/offline",
      "/games/ruta-9",
      "/games/cenote",
    ]);
  });

  it("does not repeat a route", () => {
    expect(buildPrecacheRoutes(["ruta-9", "ruta-9"])).toEqual([
      "/",
      "/games",
      "/floor-plan",
      "/offline",
      "/games/ruta-9",
    ]);
  });
});
