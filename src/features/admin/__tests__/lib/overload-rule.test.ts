import { findSustainedOverload, formatShare } from "@features/admin/lib/overload-rule";

const START = 1_000_000;

function samplesFor(durationMs: number, values: { cpu: number; memory: number }) {
  return Array.from({ length: durationMs / 10_000 + 1 }, (_, index) => ({ at: START + index * 10_000, ...values }));
}

describe("findSustainedOverload (RF-74)", () => {
  it("does not close with the CPU at 90% for 90 seconds (UT-AD-07)", () => {
    const samples = samplesFor(90_000, { cpu: 0.9, memory: 0.2 });

    expect(findSustainedOverload(samples, START + 90_000)).toBeNull();
  });

  it("closes with the memory at 90% for 2 minutes (UT-AD-08)", () => {
    const samples = samplesFor(120_000, { cpu: 0.1, memory: 0.9 });

    expect(findSustainedOverload(samples, START + 120_000)).toBe("memory");
  });

  it("starts the streak again after a sample at or below 85%", () => {
    const samples = samplesFor(180_000, { cpu: 0.95, memory: 0.1 }).map((sample) =>
      sample.at === START + 90_000 ? { ...sample, cpu: 0.85 } : sample,
    );

    expect(findSustainedOverload(samples, START + 180_000)).toBeNull();
    expect(findSustainedOverload(samples, START + 220_000)).toBe("cpu");
  });

  it("does not close with a busy day: CPU at 70% and memory at 60% for 5 minutes", () => {
    const samples = samplesFor(300_000, { cpu: 0.7, memory: 0.6 });

    expect(findSustainedOverload(samples, START + 300_000)).toBeNull();
  });

  it("needs history: no samples means no close", () => {
    expect(findSustainedOverload([], START)).toBeNull();
  });

  it("formats a share as a percentage", () => {
    expect(formatShare(0.537)).toBe("53.7%");
  });
});
