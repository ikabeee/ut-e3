import {
  LOGS_PAGE_SIZE,
  parseAuditLogFilters,
  parseLogsTab,
  parseServerLogFilters,
} from "@features/admin/lib/logs-filters";

describe("parseLogsTab", () => {
  it.each([
    [{}, "audit"],
    [{ tab: "audit" }, "audit"],
    [{ tab: "server" }, "server"],
    [{ tab: ["server", "audit"] }, "server"],
    [{ tab: "other" }, "audit"],
  ])("%j is the %s tab", (params, expected) => {
    expect(parseLogsTab(params)).toBe(expected);
  });
});

describe("parseAuditLogFilters", () => {
  it("trims the text, keeps the first of repeated values and defaults to page 1", () => {
    expect(parseAuditLogFilters({ actor: "  ana ", action: ["sql", "x"], entity: "" })).toMatchObject({
      actor: "ana",
      action: "sql",
      entity: "",
      page: 1,
    });
  });

  it("reads a day in Cancun time: from at its midnight, until at the next midnight", () => {
    const filters = parseAuditLogFilters({ from: "2026-11-20", to: "2026-11-21" });

    expect(filters.from?.toISOString()).toBe("2026-11-20T05:00:00.000Z");
    expect(filters.until?.toISOString()).toBe("2026-11-22T05:00:00.000Z");
    expect(filters).toMatchObject({ fromDate: "2026-11-20", toDate: "2026-11-21" });
  });

  it.each(["2026-13-01", "20-11-2026", "ayer", "2026-02-30"])("ignores the invalid date %s", (value) => {
    expect(parseAuditLogFilters({ from: value, to: value })).toMatchObject({
      from: null,
      until: null,
      fromDate: "",
      toDate: "",
    });
  });

  it.each([
    ["3", 3],
    ["0", 1],
    ["-2", 1],
    ["x", 1],
    ["2.5", 1],
  ])("page %s is %i", (value, expected) => {
    expect(parseAuditLogFilters({ page: value }).page).toBe(expected);
  });
});

describe("parseServerLogFilters", () => {
  it("accepts only the known levels and sources", () => {
    expect(parseServerLogFilters({ level: "warn", source: "email" })).toMatchObject({ level: "warn", source: "email" });
    expect(parseServerLogFilters({ level: "debug", source: "disk" })).toMatchObject({ level: null, source: null });
  });

  it("reads the text and the auto-refresh switch", () => {
    expect(parseServerLogFilters({ q: " timeout ", auto: "1" })).toMatchObject({
      text: "timeout",
      isAutoRefresh: true,
    });
    expect(parseServerLogFilters({})).toMatchObject({ text: "", isAutoRefresh: false });
  });
});

it("shows 25 rows per page", () => {
  expect(LOGS_PAGE_SIZE).toBe(25);
});
