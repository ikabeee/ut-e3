import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@features/site/components/site-nav";

function navbar() {
  return within(screen.getByRole("navigation", { name: "Principal" }));
}

describe("SiteNav search (S24)", () => {
  it("has a search form that sends the text to /games as the q parameter with GET", () => {
    render(<SiteNav pathname="/privacy" />);

    const form = navbar().getByRole("search", { name: "Buscar juegos" });
    const input = within(form).getByLabelText("Busca un juego");

    expect(form).toHaveAttribute("action", "/games");
    expect(form).toHaveAttribute("method", "get");
    expect(input).toHaveAttribute("name", "q");
    expect(input).toHaveAttribute("type", "search");
    expect(within(form).getByRole("button", { name: "Buscar" })).toHaveAttribute("type", "submit");
  });

  it("uses a 16 px font so a phone does not zoom when the field is focused", () => {
    render(<SiteNav pathname="/privacy" />);

    expect(navbar().getByLabelText("Busca un juego")).toHaveClass("text-base");
  });

  it("repeats the search inside the phone menu and closes the menu on submit", async () => {
    const user = userEvent.setup();
    render(<SiteNav pathname="/privacy" />);

    await user.click(navbar().getByRole("button", { name: "Abrir menú" }));

    const menu = within(await screen.findByRole("dialog", { name: "Menú" }));
    const form = menu.getByRole("search", { name: "Buscar juegos" });

    expect(form).toHaveAttribute("action", "/games");
    expect(form).toHaveAttribute("method", "get");
    expect(within(form).getByLabelText("Busca un juego")).toHaveAttribute("name", "q");
  });

  it("shows no search with only the landing published", () => {
    render(<SiteNav pathname="/" isLandingOnly />);

    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Busca un juego")).not.toBeInTheDocument();
  });

  it("shows no search on staff screens", () => {
    render(<SiteNav pathname="/admin/kof" />);

    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });
});
