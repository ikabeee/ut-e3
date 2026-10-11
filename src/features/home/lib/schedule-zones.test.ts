import { EVENT_SCHEDULE } from "@features/event/lib/event-program";
import type { ScheduleEntry } from "@features/event/lib/types";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import { resolveScheduleZones } from "@features/home/lib/schedule-zones";

describe("resolveScheduleZones", () => {
  it("links every entry of the event schedule to a zone of the floor plan", () => {
    expect(() => resolveScheduleZones(EVENT_SCHEDULE, PLAN_ZONES)).not.toThrow();
  });

  it("adds the visible name of the zone", () => {
    const [opening, presentation] = resolveScheduleZones(EVENT_SCHEDULE, PLAN_ZONES);

    expect(opening).toMatchObject({ time: "10:00", zoneId: "entry", zoneTitle: "Entrada" });
    expect(presentation).toMatchObject({ zoneId: "stage", zoneTitle: "Main Stage" });
  });

  it("fails with the entry and the zone when the zone does not exist", () => {
    const schedule: ScheduleEntry[] = [{ time: "11:00", title: "Concierto", zoneId: "escenario" }];

    expect(() => resolveScheduleZones(schedule, PLAN_ZONES)).toThrow('"Concierto" con la zona "escenario"');
  });

  it("does not accept inherited properties as zones", () => {
    const schedule: ScheduleEntry[] = [{ time: "11:00", title: "Prueba", zoneId: "toString" }];

    expect(() => resolveScheduleZones(schedule, PLAN_ZONES)).toThrow('zona "toString"');
  });
});
