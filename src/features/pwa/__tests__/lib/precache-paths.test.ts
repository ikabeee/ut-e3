import { loadSwPolicy } from "@features/pwa/__tests__/lib/load-sw-policy";
import { buildPrecachePaths } from "@features/pwa/lib/precache-paths";

describe("buildPrecachePaths (RNF-14)", () => {
  it("lists the landing with the floor plan, the catalog, every game, the sponsors, the privacy notice and /offline", () => {
    expect(buildPrecachePaths(["ruta-9", "hormigon"])).toEqual([
      "/",
      "/games",
      "/sponsors",
      "/privacy",
      "/offline",
      "/games/ruta-9",
      "/games/hormigon",
    ]);
  });

  it("only lists pages that the worker accepts to store", () => {
    const policy = loadSwPolicy();
    const paths = buildPrecachePaths(["ruta-9"]);

    expect(policy.filterPrecachePaths(paths)).toEqual(paths);
  });
});
