import { FLOOR_PLAN_SECTION_ID, floorPlanItemHref, getZoneLink } from "@features/floor-plan/lib/floor-plan-links";

describe("floor plan links", () => {
  it("names the section that the croquis renders", () => {
    expect(FLOOR_PLAN_SECTION_ID).toBe("floor-plan");
  });

  it("builds the hash of a stand or a zone", () => {
    expect(floorPlanItemHref("ZA-S3")).toBe("#floor-plan-ZA-S3");
    expect(floorPlanItemHref("marketplace")).toBe("#floor-plan-marketplace");
  });

  it.each([
    ["stage", "Escenario principal"],
    ["kof", "Arena KOF"],
    ["mario-kart", "Mario Kart"],
    ["restrooms", "Baños"],
    ["rear-marketplace", "Marketplace trasero"],
    ["marketplace", "Marketplace central"],
    ["cafeteria", "Cafetería externa"],
    ["help-center-1", "Centro de atención 1"],
  ])("links the %s zone to its place in the croquis", (zoneId, title) => {
    expect(getZoneLink(zoneId)).toEqual({ href: `#floor-plan-${zoneId}`, label: title });
  });

  it("returns null for a zone that does not exist", () => {
    expect(getZoneLink("arena")).toBeNull();
    expect(getZoneLink("")).toBeNull();
  });

  it("returns null for the zones that are not in the Edificio B croquis", () => {
    expect(getZoneLink("entrance")).toBeNull();
    expect(getZoneLink("rest-area")).toBeNull();
    expect(getZoneLink("help-desk")).toBeNull();
  });
});
