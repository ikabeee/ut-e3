import { buildEmailsHref, parseEmailFilters } from "@features/admin/lib/email-filters";

describe("parseEmailFilters", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseEmailFilters({
        status: "failed",
        recipient: " ana@ ",
        subject: "PIN",
        from: "2026-11-18",
        to: "2026-11-20",
        page: "3",
      }),
    ).toEqual({
      status: "failed",
      recipient: "ana@",
      subject: "PIN",
      from: "2026-11-18",
      to: "2026-11-20",
      page: 3,
    });
  });

  it("reads missing or nonsensical values as no filter, and takes the first of a repeated one", () => {
    expect(parseEmailFilters({ status: "otro", from: "2026-02-31", to: "ayer", page: "-4" })).toEqual({
      status: "all",
      recipient: "",
      subject: "",
      from: "",
      to: "",
      page: 1,
    });
    expect(parseEmailFilters({ status: ["sent", "failed"], page: ["2", "9"] })).toMatchObject({
      status: "sent",
      page: 2,
    });
  });
});

describe("buildEmailsHref", () => {
  const base = parseEmailFilters({});

  it("leaves out the defaults", () => {
    expect(buildEmailsHref("/admin/emails", base)).toBe("/admin/emails");
  });

  it("keeps the filters and sets the page", () => {
    const filters = parseEmailFilters({ status: "sent", recipient: "ana", from: "2026-11-18" });

    expect(buildEmailsHref("/admin/emails", filters, 2)).toBe(
      "/admin/emails?status=sent&recipient=ana&from=2026-11-18&page=2",
    );
  });
});
