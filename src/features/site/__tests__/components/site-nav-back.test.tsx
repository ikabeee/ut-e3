import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@features/site/components/site-nav";

afterEach(() => {
  jest.restoreAllMocks();
});

function backControl() {
  return screen.queryByRole("link", { name: "Volver" }) ?? screen.queryByRole("button", { name: "Volver" });
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(navbar().getByRole("button", { name: "Abrir menú" }));

  return user;
}

function navbar() {
  return within(screen.getByRole("navigation", { name: "Principal" }));
}

// The UTG logo already leads home, so the navbar has no Volver control: it repeated the logo and pushed the navbar
// past a 360 px screen.
describe("SiteNav without a back control", () => {
  it.each(["/", "/games", "/raffle", "/games/abby-s-tower"])("shows no Volver control on %s", (pathname) => {
    render(<SiteNav pathname={pathname} />);

    expect(backControl()).not.toBeInTheDocument();
    expect(navbar().getByRole("link", { name: "UTG, inicio" })).toBeInTheDocument();
  });
});

describe("SiteNav phone menu and the Back gesture (S2)", () => {
  it("pushes a history entry when the menu opens", async () => {
    const pushState = jest.spyOn(window.history, "pushState");
    render(<SiteNav pathname="/raffle" />);

    await openMenu();

    expect(pushState).toHaveBeenCalled();
  });

  it("closes the menu on popstate and stays on the page", async () => {
    render(<SiteNav pathname="/raffle" />);

    await openMenu();
    expect(await screen.findByRole("dialog", { name: "Menú" })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("popstate"));
    });

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
  });

  it("removes the pushed entry when the menu closes by other means", async () => {
    const goBack = jest.spyOn(window.history, "back");
    render(<SiteNav pathname="/raffle" />);

    const user = await openMenu();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});

describe("SiteNav existing behavior (guards)", () => {
  it("keeps marking the current section on a game page", () => {
    render(<SiteNav pathname="/games/abby-s-tower" />);

    expect(navbar().getByRole("link", { name: "Juegos" })).toHaveAttribute("aria-current", "page");
  });

  it("still renders nothing on staff and projection screens", () => {
    render(<SiteNav pathname="/raffle/live" />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(backControl()).not.toBeInTheDocument();
  });
});
