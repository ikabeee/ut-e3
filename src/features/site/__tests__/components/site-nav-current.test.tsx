import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@features/site/components/site-nav";

const SECTIONS = [
  ["/", "Inicio"],
  ["/games", "Juegos"],
  ["/games/abby-s-tower", "Juegos"],
  ["/floor-plan", "Croquis"],
  ["/sponsors", "Patrocinadores"],
  ["/raffle", "Rifa"],
  ["/tournament", "Torneo"],
];

const LABELS = ["Inicio", "Juegos", "Croquis", "Patrocinadores", "Rifa", "Torneo"];

function navbar() {
  return within(screen.getByRole("navigation", { name: "Principal" }));
}

describe("SiteNav current section (S25)", () => {
  it.each(SECTIONS)("on %s marks only %s in the bar", (pathname, current) => {
    render(<SiteNav pathname={pathname} />);

    for (const label of LABELS) {
      const link = navbar().getByRole("link", { name: label });

      if (label === current) {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });

  it("gives the current link a visible style that reacts to aria-current", () => {
    render(<SiteNav pathname="/games" />);

    expect(navbar().getByRole("link", { name: "Juegos" })).toHaveClass("aria-[current=page]:text-accent");
  });

  it.each(SECTIONS)("on %s marks only %s in the phone menu", async (pathname, current) => {
    const user = userEvent.setup();
    render(<SiteNav pathname={pathname} />);

    await user.click(navbar().getByRole("button", { name: "Abrir menú" }));

    const menu = within(await screen.findByRole("dialog", { name: "Menú" }));

    for (const label of LABELS) {
      const link = menu.getByRole("link", { name: label });

      if (label === current) {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });

  it("marks nothing in the landing-only bar, whose entries are anchors", () => {
    render(<SiteNav pathname="/" isLandingOnly />);

    for (const link of navbar().getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});
