import { MIN_DATABASE_FREE_BYTES, getHealthStatus } from "@features/site/lib/health-status";

describe("getHealthStatus", () => {
  it("is ok with room on the volume of the database", () => {
    expect(getHealthStatus(MIN_DATABASE_FREE_BYTES)).toBe("ok");
  });

  it("reports a disk about to fill, where SQLite answers SQLITE_FULL", () => {
    expect(getHealthStatus(MIN_DATABASE_FREE_BYTES - 1)).toBe("low-disk");
    expect(getHealthStatus(0)).toBe("low-disk");
  });

  it("only counts the answer of the server when the volume cannot be read", () => {
    expect(getHealthStatus(null)).toBe("ok");
  });
});
