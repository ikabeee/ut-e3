import { formatTimecode } from "@features/event/lib/event-media";
import { describeShowcase, EVENT_SCHEDULE } from "@features/event/lib/event-program";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";

describe("formatTimecode", () => {
  it("writes minutes, seconds and frames", () => {
    expect(formatTimecode(0)).toBe("00:00:00");
    expect(formatTimecode(75.5)).toBe("01:15:15");
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

describe("buildEventStructuredData", () => {
  it("describes a free, in-person schema.org Event at the UT Cancún", () => {
    expect(buildEventStructuredData("https://utg.example", 18)).toMatchObject({
      "@type": "Event",
      startDate: "2026-11-27T10:00:00-05:00",
      isAccessibleForFree: true,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: "https://utg.example/media/reel.jpg",
      location: { "@type": "Place", name: "Universidad Tecnológica de Cancún" },
    });
  });
});
