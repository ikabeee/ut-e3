import { parseVisitorListParams, VISITORS_PAGE_SIZE } from "@features/visitors/lib/visitors-admin";

describe("parseVisitorListParams", () => {
  it("defaults to the first page, newest first and no query", () => {
    expect(parseVisitorListParams({})).toEqual({ query: "", page: 1, sort: "newest" });
  });

  it("trims and bounds the query and reads the first value of a repeated parameter", () => {
    expect(parseVisitorListParams({ q: ["  ana  ", "otro"] }).query).toBe("ana");
    expect(parseVisitorListParams({ q: "x".repeat(300) }).query).toHaveLength(120);
  });

  it.each(["0", "-3", "abc", "1.5", "", "99999999999"])("falls back to page 1 for %j", (page) => {
    expect(parseVisitorListParams({ page }).page).toBe(1);
  });

  it("reads a valid page and only accepts the two sorts", () => {
    expect(parseVisitorListParams({ page: "4", sort: "oldest" })).toMatchObject({ page: 4, sort: "oldest" });
    expect(parseVisitorListParams({ sort: "gamertag" }).sort).toBe("newest");
  });

  it("pages by 50", () => {
    expect(VISITORS_PAGE_SIZE).toBe(50);
  });
});
