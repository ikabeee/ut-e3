import { ALL_FILTER_VALUE, parseAccountFilter } from "@features/accounts/lib/account-admin-filter";

describe("parseAccountFilter", () => {
  it("is empty without a query string", () => {
    expect(parseAccountFilter({})).toEqual({
      role: undefined,
      status: undefined,
      standId: undefined,
      search: undefined,
    });
  });

  it("reads the role, the status, the stand and the search, trimmed", () => {
    expect(parseAccountFilter({ role: "kof_staff", status: "disabled", stand: "stand-1", q: "  ana " })).toEqual({
      role: "kof_staff",
      status: "disabled",
      standId: "stand-1",
      search: "ana",
    });
  });

  it("ignores a role or a status that does not exist and the value of 'all'", () => {
    expect(
      parseAccountFilter({ role: "root", status: ALL_FILTER_VALUE, stand: ALL_FILTER_VALUE, q: ["first", "second"] }),
    ).toEqual({ role: undefined, status: undefined, standId: undefined, search: "first" });
  });

  it("caps the search at 120 characters", () => {
    expect(parseAccountFilter({ q: "x".repeat(300) }).search).toHaveLength(120);
  });
});
