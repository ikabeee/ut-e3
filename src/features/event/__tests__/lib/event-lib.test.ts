import { canAutoplayReel, formatTimecode } from "@features/event/lib/event-media";
import { getEventContent } from "@features/event/lib/event-content";
import {
  buildEventActivities,
  describeShowcase,
  EVENT_SCHEDULE,
  getScheduleHighlights,
} from "@features/event/lib/event-program";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";

describe("formatTimecode", () => {
  it("writes minutes, seconds and frames", () => {
    expect(formatTimecode(0)).toBe("00:00:00");
    expect(formatTimecode(75.5)).toBe("01:15:15");
  });
});

describe("canAutoplayReel", () => {
  const desktop = { isWideScreen: true, prefersSaveData: false, prefersReducedMotion: false };

  it("autoplays only on a wide screen without save data or reduced motion", () => {
    expect(canAutoplayReel(desktop)).toBe(true);
    expect(canAutoplayReel({ ...desktop, isWideScreen: false })).toBe(false);
    expect(canAutoplayReel({ ...desktop, prefersSaveData: true })).toBe(false);
    expect(canAutoplayReel({ ...desktop, prefersReducedMotion: true })).toBe(false);
  });
});

describe("describeShowcase", () => {
  it("uses the real number of games", () => {
    expect(describeShowcase(18)).toMatch(/^18 juegos creados por la División de Ingeniería y Tecnologías\./);
  });
});

describe("EVENT_SCHEDULE", () => {
  it("is sorted by time", () => {
    const times = EVENT_SCHEDULE.map((entry) => entry.time);

    expect(times).toEqual([...times].sort((a, b) => a.localeCompare(b)));
  });
});

describe("getScheduleHighlights", () => {
  it("takes the tournament and raffle times from the schedule", () => {
    expect(getScheduleHighlights(EVENT_SCHEDULE)).toEqual({
      tournamentSignupDeadline: "12:00",
      tournamentRoundsAt: "13:30",
      tournamentFinalsAt: "17:00",
      raffleTimes: ["13:00", "16:00", "19:00"],
    });
  });

  it("fails when the schedule does not mark a milestone", () => {
    const withoutFinals = EVENT_SCHEDULE.filter((entry) => entry.milestone !== "tournamentFinals");

    expect(() => getScheduleHighlights(withoutFinals)).toThrow('"tournamentFinals"');
  });
});

describe("buildEventActivities", () => {
  it("writes the tournament and raffle cards with the times of the schedule", () => {
    const [tournaments, raffles] = buildEventActivities({
      tournamentSignupDeadline: "11:00",
      tournamentRoundsAt: "12:30",
      tournamentFinalsAt: "18:00",
      raffleTimes: ["14:00", "16:00", "18:00", "20:00"],
    });

    expect(tournaments.description).toContain("antes de las 11:00");
    expect(tournaments.facts.map((fact) => fact.value)).toEqual(["Hasta 11:00", "12:30", "18:00"]);
    expect(raffles.facts.map((fact) => `${fact.label} ${fact.value}`)).toEqual([
      "Primero 14:00",
      "Segundo 16:00",
      "Tercero 18:00",
      "Final 20:00",
    ]);
  });
});

describe("getEventContent", () => {
  it("derives the date labels and the calendar link from the start and end of the event", () => {
    const { info } = getEventContent();

    expect(info).toMatchObject({ dateLabel: "27.11.2026", shortDateLabel: "27.11.26", hoursLabel: "10:00—20:00" });
    expect(new URL(info.calendarUrl).searchParams.get("dates")).toBe("20261127T150000Z/20261128T010000Z");
  });
});

describe("buildEventStructuredData", () => {
  it("describes a free, in-person schema.org Event at the UT Cancún", () => {
    expect(buildEventStructuredData("https://utg.example", 18)).toMatchObject({
      "@type": "Event",
      startDate: "2026-11-27T10:00:00-05:00",
      isAccessibleForFree: true,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: "https://utg.example/media/reel.jpg",
      location: {
        "@type": "Place",
        name: "Universidad Tecnológica de Cancún",
        address: { streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1", postalCode: "77565" },
      },
      organizer: { name: "Universidad Tecnológica de Cancún" },
    });
  });
});
