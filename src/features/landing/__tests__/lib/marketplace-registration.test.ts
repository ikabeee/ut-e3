import { getMarketplaceRegistration } from "@features/landing/lib/marketplace-registration";

const FORM_URL = "https://forms.gle/marketplace";

const CLOSES_AT = "2026-11-13T05:00:00.000Z";

describe("getMarketplaceRegistration", () => {
  it("is open with the form URL before the closing instant", () => {
    const now = new Date("2026-11-13T04:59:59.999Z");

    expect(getMarketplaceRegistration({ formUrl: FORM_URL, closesAt: CLOSES_AT }, now)).toEqual({
      status: "open",
      formUrl: FORM_URL,
    });
  });

  it("is unannounced before the closing instant while there is no form URL", () => {
    const now = new Date("2026-11-01T12:00:00.000Z");

    expect(getMarketplaceRegistration({ formUrl: null, closesAt: CLOSES_AT }, now)).toEqual({
      status: "unannounced",
    });
  });

  it("is closed exactly at the closing instant", () => {
    const now = new Date(CLOSES_AT);

    expect(getMarketplaceRegistration({ formUrl: FORM_URL, closesAt: CLOSES_AT }, now)).toEqual({ status: "closed" });
  });

  it("is closed after the closing instant, with or without a form URL", () => {
    const now = new Date("2026-11-20T18:00:00.000Z");

    expect(getMarketplaceRegistration({ formUrl: FORM_URL, closesAt: CLOSES_AT }, now)).toEqual({ status: "closed" });
    expect(getMarketplaceRegistration({ formUrl: null, closesAt: CLOSES_AT }, now)).toEqual({ status: "closed" });
  });
});
