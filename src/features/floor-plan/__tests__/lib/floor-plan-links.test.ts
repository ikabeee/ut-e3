import {
  FLOOR_PLAN_PATH,
  FLOOR_PLAN_SECTION_ID,
  floorPlanItemHref,
  getFloorPlanItemPath,
  getItemIdFromHash,
  getZoneLink,
} from "@features/floor-plan/lib/floor-plan-links";

describe("floor plan links", () => {
  it("names the section that the croquis renders", () => {
    expect(FLOOR_PLAN_SECTION_ID).toBe("floor-plan");
  });

  it("opens the croquis on its own page", () => {
    expect(FLOOR_PLAN_PATH).toBe("/floor-plan");
  });

  it("links a stand or a zone to its item on the floor plan page", () => {
    expect(getFloorPlanItemPath("ZA-S3")).toBe("/floor-plan#floor-plan-ZA-S3");
    expect(getFloorPlanItemPath("kof")).toBe("/floor-plan#floor-plan-kof");
  });

  it("builds the hash of a stand or a zone", () => {
    expect(floorPlanItemHref("ZA-S3")).toBe("#floor-plan-ZA-S3");
    expect(floorPlanItemHref("marketplace")).toBe("#floor-plan-marketplace");
  });

  it("reads the selected item back from its hash", () => {
    expect(getItemIdFromHash("#floor-plan-ZA-S3")).toBe("ZA-S3");
    expect(getItemIdFromHash("#floor-plan-kof")).toBe("kof");
    expect(getItemIdFromHash("#games")).toBeNull();
    expect(getItemIdFromHash("floor-plan-ZA-S3")).toBeNull();
  });

  it.each([
    ["stage", "Escenario principal"],
    ["kof", "Arena KOF"],
    ["mario-kart", "Mario Kart"],
    ["restrooms", "Baños"],
    ["marketplace", "Marketplace central"],
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

  it("returns null for the rear marketplace and the cafeteria, which left the croquis", () => {
    expect(getZoneLink("rear-marketplace")).toBeNull();
    expect(getZoneLink("cafeteria")).toBeNull();
  });
});
