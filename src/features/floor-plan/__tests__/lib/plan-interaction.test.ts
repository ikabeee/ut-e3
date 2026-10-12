import { getItemInteraction, type PlanSelection } from "@features/floor-plan/lib/plan-interaction";
import { buildPlanItems, indexItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_ZONE_TIMES_FIXTURE, STAND_OCCUPANT_FIXTURES } from "@features/floor-plan/__tests__/plan-fixtures";

const itemsById = indexItems(buildPlanItems(STAND_OCCUPANT_FIXTURES, PLAN_ZONE_TIMES_FIXTURE));

function selection(overrides: Partial<PlanSelection> = {}): PlanSelection {
  return { itemsById, selectedId: null, onSelectItem: jest.fn(), ...overrides };
}

describe("getItemInteraction", () => {
  it("marks only the selected item", () => {
    const state = selection({ selectedId: "B7" });

    expect(getItemInteraction("B7", state).isSelected).toBe(true);
    expect(getItemInteraction("A1", state).isSelected).toBe(false);
  });

  it("shows every item when there are no filters", () => {
    expect(getItemInteraction("stage", selection()).isHidden).toBe(false);
  });

  it("hides the items whose category is filtered out", () => {
    const state = selection({ visibleCategories: new Set(["team"]) });

    expect(getItemInteraction("A1", state).isHidden).toBe(false);
    expect(getItemInteraction("stage", state).isHidden).toBe(true);
  });

  it("never hides an id that is not on the plan", () => {
    expect(getItemInteraction("Z9", selection({ visibleCategories: new Set() })).isHidden).toBe(false);
  });

  it("selects the item by its id", () => {
    const state = selection();

    getItemInteraction("A4", state).onSelect();

    expect(state.onSelectItem).toHaveBeenCalledWith("A4");
  });
});
