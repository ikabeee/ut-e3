import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@features/site/components/site-nav";

afterEach(() => {
  jest.restoreAllMocks();
});

// The back control is a link or a button named "Volver": the tests accept
// either element so round 2 can choose it, but the accessible name is fixed.
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

describe("SiteNav back control (S1)", () => {
  it.each(["/games", "/raffle", "/games/abby-s-tower"])("shows a Volver control on %s", (pathname) => {
    render(<SiteNav pathname={pathname} />);

    expect(backControl()).toBeInTheDocument();
  });

  it("hides the Volver control on the landing", () => {
    render(<SiteNav pathname="/" />);

    expect(backControl()).not.toBeInTheDocument();
  });

  it("hides the Volver control while only the landing is published", () => {
    render(<SiteNav pathname="/games" isLandingOnly />);

    expect(backControl()).not.toBeInTheDocument();
  });

  it("names the back control Volver for assistive technology", () => {
    render(<SiteNav pathname="/games" />);

    expect(
      screen.queryByRole("link", { name: "Volver" }) ?? screen.getByRole("button", { name: "Volver" }),
    ).toBeInTheDocument();
  });

  it("gives the Volver control a touch target of at least 44 px", () => {
    render(<SiteNav pathname="/games" />);

    const control = backControl();
    expect(control).toBeInTheDocument();
    // JSDOM has no layout, so the 44 px guarantee is read from the class:
    // size-11 is 44 px square and touch-target extends smaller elements to
    // 44 px (AGENTS.md, movil primero).
    expect(control?.className ?? "").toMatch(/touch-target|size-11|min-h-1[12]|min-w-11/);
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

describe("SiteNav existing behavior with the back control (guards)", () => {
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
