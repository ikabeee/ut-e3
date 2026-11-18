import { buildLoadChart } from "@features/admin/lib/load-chart";

const SIZE = { width: 100, height: 50 };

// S4: the CPU and the memory of the last minutes drawn as a line, with the 85% of the automatic close (RF-74).
describe("buildLoadChart", () => {
  it("has nothing to draw with less than two samples", () => {
    expect(buildLoadChart([], "cpu", SIZE)).toBeNull();
    expect(buildLoadChart([{ at: 0, cpu: 0.4, memory: 0.5 }], "cpu", SIZE)).toBeNull();
  });

  it("has nothing to draw when every sample was taken at the same instant", () => {
    const samples = [
      { at: 5, cpu: 0.1, memory: 0.2 },
      { at: 5, cpu: 0.3, memory: 0.4 },
    ];

    expect(buildLoadChart(samples, "cpu", SIZE)).toBeNull();
  });

  it("spreads the samples over the width by time and puts 0% at the bottom and 100% at the top", () => {
    const samples = [
      { at: 0, cpu: 0, memory: 0.9 },
      { at: 10_000, cpu: 0.5, memory: 0.9 },
      { at: 20_000, cpu: 1, memory: 0.9 },
    ];

    expect(buildLoadChart(samples, "cpu", SIZE)).toEqual({
      line: "M0,50 L50,25 L100,0",
      area: "M0,50 L50,25 L100,0 L100,50 L0,50 Z",
      thresholdY: 7.5,
      latest: 1,
      peak: 1,
      startsAt: 0,
      endsAt: 20_000,
    });
  });

  it("reads the metric it is asked for", () => {
    const samples = [
      { at: 0, cpu: 0, memory: 0.2 },
      { at: 30_000, cpu: 1, memory: 0.6 },
    ];

    expect(buildLoadChart(samples, "memory", SIZE)).toMatchObject({ line: "M0,40 L100,20", latest: 0.6, peak: 0.6 });
  });

  it("orders the samples by time and tells the peak from the last reading", () => {
    const samples = [
      { at: 30_000, cpu: 0.2, memory: 0 },
      { at: 0, cpu: 0.9, memory: 0 },
      { at: 10_000, cpu: 0.4, memory: 0 },
    ];

    expect(buildLoadChart(samples, "cpu", SIZE)).toMatchObject({
      line: "M0,5 L33.33,30 L100,40",
      latest: 0.2,
      peak: 0.9,
      startsAt: 0,
      endsAt: 30_000,
    });
  });

  it("keeps a reading out of range inside the chart", () => {
    const samples = [
      { at: 0, cpu: -0.1, memory: 0 },
      { at: 10_000, cpu: 1.2, memory: 0 },
    ];

    expect(buildLoadChart(samples, "cpu", SIZE)?.line).toBe("M0,50 L100,0");
  });
});
