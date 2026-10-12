import {
  buildPlanItems,
  getItemKicker,
  groupItemsByCategory,
  indexItems,
  splitStandName,
  toggleCategory,
} from "@features/floor-plan/lib/plan-items";
import { STAND_OCCUPANT_FIXTURES } from "@features/floor-plan/__tests__/plan-fixtures";
import { PLAN_CATEGORIES } from "@features/floor-plan/lib/plan-places";

describe("buildPlanItems", () => {
  const items = buildPlanItems(STAND_OCCUPANT_FIXTURES);
  const itemsById = indexItems(items);

  it("creates one item per team stand, info stand and zone", () => {
    expect(items).toHaveLength(STAND_OCCUPANT_FIXTURES.length + 4 + 8);
  });

  it("fills each team stand with its occupant", () => {
    expect(itemsById.get("B7")).toMatchObject({ category: "team", title: "Lucha Pixel", subtitle: "Pelea" });
  });

  it("keeps the cover of the occupant and leaves the rest without one", () => {
    const cover = "portada";
    const [first] = buildPlanItems([{ ...STAND_OCCUPANT_FIXTURES[0], cover }]);

    expect(first.cover).toBe(cover);
    expect(itemsById.get("C1")?.cover).toBeNull();
    expect(itemsById.get("stage")?.cover).toBeNull();
  });

  it("groups the directory in the design order", () => {
    const groups = groupItemsByCategory(items);

    expect(groups.map((group) => group.category)).toEqual(["team", "info", "act", "srv"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(STAND_OCCUPANT_FIXTURES.map((occupant) => occupant.stand));
    expect(groups[2].items.map((item) => item.id)).toEqual(["stage", "arena", "raffles", "entry"]);
    expect(groups[3].items.map((item) => item.id)).toEqual(["food", "info", "wc", "rest"]);
  });

  it.each([
    ["A1", "Stand A1 · Acción"],
    ["C2", "Stand C2 · Informativo"],
    ["wc", "Servicios"],
  ])("writes the kicker of %s", (id, kicker) => {
    const item = itemsById.get(id);

    expect(item && getItemKicker(item)).toBe(kicker);
  });
});

describe("splitStandName", () => {
  it("splits the name in two uppercase lines", () => {
    expect(splitStandName("Los Últimos Faros")).toEqual(["LOS ÚLTIMOS", "FAROS"]);
    expect(splitStandName("Turbina")).toEqual(["TURBINA", ""]);
  });
});

describe("toggleCategory", () => {
  const all = new Set(PLAN_CATEGORIES);

  it("hides a visible category", () => {
    expect([...toggleCategory(all, "srv")]).toEqual(["team", "info", "act"]);
  });

  it("shows a hidden category again", () => {
    expect(toggleCategory(new Set(["team"] as const), "info")).toEqual(new Set(["team", "info"]));
  });

  it("shows every category when the only visible one is pressed", () => {
    expect(toggleCategory(new Set(["act"] as const), "act")).toEqual(all);
  });
});
