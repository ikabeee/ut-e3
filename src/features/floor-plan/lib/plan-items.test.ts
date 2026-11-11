import {
  buildPlanItems,
  getItemKicker,
  groupItemsByCategory,
  indexItems,
  splitStandName,
  toggleCategory,
} from "@features/floor-plan/lib/plan-items";
import { PLAN_CATEGORIES } from "@features/floor-plan/lib/plan-places";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

describe("buildPlanItems", () => {
  const items = buildPlanItems(MOCK_GAMES);
  const itemsById = indexItems(items);

  it("creates one item per team stand, info stand and zone", () => {
    expect(items).toHaveLength(MOCK_GAMES.length + 4 + 8);
  });

  it("links each team stand to its game", () => {
    expect(itemsById.get("B7")).toMatchObject({ category: "team", title: "Lucha Pixel", subtitle: "Pelea" });
    expect(itemsById.get("B7")?.game?.slug).toBe("lucha-pixel");
  });

  it("groups the directory in the design order", () => {
    const groups = groupItemsByCategory(items);

    expect(groups.map((group) => group.category)).toEqual(["team", "info", "act", "srv"]);
    expect(groups[0].items.slice(0, 5).map((item) => item.id)).toEqual(["A1", "A2", "A3", "A4", "B1"]);
    expect(groups[2].items.map((item) => item.id)).toEqual(["stage", "arena", "sorteos", "entry"]);
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
