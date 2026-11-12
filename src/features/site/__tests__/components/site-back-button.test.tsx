import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteBackButton } from "@features/site/components/site-back-button";

const SAME_SITE_HOME = `${window.location.origin}/`;

function setReferrer(value: string) {
  Object.defineProperty(document, "referrer", { value, configurable: true });
}

afterEach(() => {
  jest.restoreAllMocks();
  setReferrer("");
});

describe("SiteBackButton press behavior (S1)", () => {
  it("goes back in history when the previous entry belongs to this site", async () => {
    const goBack = jest.spyOn(window.history, "back");
    window.history.pushState({}, "", "/games");
    setReferrer(SAME_SITE_HOME);
    render(<SiteBackButton pathname="/games/abby-s-tower" />);

    await userEvent.setup().click(screen.getByRole("link", { name: "Volver" }));

    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("falls back to the catalog from a game page without same-site history", async () => {
    const goBack = jest.spyOn(window.history, "back");
    render(<SiteBackButton pathname="/games/abby-s-tower" />);
    const control = screen.getByRole("link", { name: "Volver" });

    expect(control).toHaveAttribute("href", "/games");

    await userEvent.setup().click(control);

    expect(goBack).not.toHaveBeenCalled();
  });

  it("falls back to the landing from any other page with a cross-site referrer", async () => {
    const goBack = jest.spyOn(window.history, "back");
    window.history.pushState({}, "", "/raffle");
    setReferrer("https://externo.example/");
    render(<SiteBackButton pathname="/raffle" />);
    const control = screen.getByRole("link", { name: "Volver" });

    expect(control).toHaveAttribute("href", "/");

    await userEvent.setup().click(control);

    expect(goBack).not.toHaveBeenCalled();
  });
});
