import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@features/site/components/site-nav";

const APP_LINKS = [
  ["Inicio", "/"],
  ["Juegos", "/games"],
  ["Croquis", "/floor-plan"],
  ["Patrocinadores", "/sponsors"],
  ["Rifa", "/raffle"],
  ["Torneo", "/tournament"],
];

function navbar() {
  return within(screen.getByRole("navigation", { name: "Principal" }));
}

describe("SiteNav with the full app published", () => {
  it("links the six sections of the app in order", () => {
    render(<SiteNav pathname="/privacy" />);

    for (const [label, href] of APP_LINKS) {
      expect(navbar().getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("shows Mi pasaporte as the call to action", () => {
    render(<SiteNav pathname="/privacy" />);

    expect(navbar().getByRole("link", { name: "Mi pasaporte" })).toHaveAttribute("href", "/passport");
  });

  it("links the logo to the home page", () => {
    render(<SiteNav pathname="/games" />);

    expect(navbar().getByRole("link", { name: "UTG, inicio" })).toHaveAttribute("href", "/");
  });

  it("marks the section of the current page and no other", () => {
    render(<SiteNav pathname="/games/abby-s-tower" />);

    expect(navbar().getByRole("link", { name: "Juegos" })).toHaveAttribute("aria-current", "page");
    expect(navbar().getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
    expect(navbar().getByRole("link", { name: "Rifa" })).not.toHaveAttribute("aria-current");
  });

  it("marks Mi pasaporte on the passport", () => {
    render(<SiteNav pathname="/passport" />);

    expect(navbar().getByRole("link", { name: "Mi pasaporte" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the full list of links from the menu button and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<SiteNav pathname="/raffle" />);

    const menuButton = navbar().getByRole("button", { name: "Abrir menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    const menu = within(await screen.findByRole("dialog", { name: "Menú" }));

    for (const [label, href] of APP_LINKS) {
      expect(menu.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    expect(menu.getByRole("link", { name: "Rifa" })).toHaveAttribute("aria-current", "page");
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
  });

  it("closes the menu when a link is chosen", async () => {
    const user = userEvent.setup();
    render(<SiteNav pathname="/" />);

    await user.click(navbar().getByRole("button", { name: "Abrir menú" }));
    await user.click(
      within(await screen.findByRole("dialog", { name: "Menú" })).getByRole("link", { name: "Croquis" }),
    );

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
  });
});

describe("SiteNav with only the landing published", () => {
  it("links the three sections of the landing as anchors", () => {
    render(<SiteNav pathname="/" isLandingOnly />);

    const links = navbar()
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-label") === null)
      .map((link) => [link.textContent, link.getAttribute("href")]);

    expect(links).toEqual([
      ["Juegos", "/#games"],
      ["Patrocinadores", "/#sponsors"],
      ["Croquis", "/#floor-plan"],
    ]);
  });

  it("sends the logo to the top of the landing", () => {
    render(<SiteNav pathname="/" isLandingOnly />);

    expect(navbar().getByRole("link", { name: "UTG, inicio" })).toHaveAttribute("href", "/#top");
  });

  it("has no call to action and no menu", () => {
    render(<SiteNav pathname="/" isLandingOnly />);

    expect(navbar().queryByRole("link", { name: "Mi pasaporte" })).not.toBeInTheDocument();
    expect(navbar().queryByRole("button", { name: "Abrir menú" })).not.toBeInTheDocument();
  });
});

describe("SiteNav on staff and projection screens", () => {
  it.each(["/admin/kof", "/raffle/live", "/login"])("renders nothing on %s", (pathname) => {
    render(<SiteNav pathname={pathname} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
