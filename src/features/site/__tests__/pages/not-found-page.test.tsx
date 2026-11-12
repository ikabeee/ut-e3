import { render, screen, within } from "@testing-library/react";
import { NotFoundPage, notFoundPageMetadata } from "@features/site/pages/not-found-page";

describe("NotFoundPage", () => {
  it("explains the error and links back home", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute("href", "/");
  });

  it("offers the games, the floor plan and the schedule as ways out", () => {
    render(<NotFoundPage />);

    const exits = within(screen.getByRole("navigation", { name: "Sigue explorando" }));

    expect(exits.getByRole("link", { name: /Juegos/ })).toHaveAttribute("href", "/games");
    expect(exits.getByRole("link", { name: /Croquis/ })).toHaveAttribute("href", "/#floor-plan");
    expect(exits.getByRole("link", { name: /Cronograma/ })).toHaveAttribute("href", "/#schedule");
  });

  it("draws the 404 as decoration, hidden from screen readers", () => {
    const { container } = render(<NotFoundPage />);

    const code = container.querySelector(".glitch-layer-base");

    expect(code).toHaveTextContent("404");
    expect(code?.closest("[aria-hidden=true]")).not.toBeNull();
  });

  it("renders no navbar of its own: the root layout mounts the site navbar", () => {
    render(<NotFoundPage />);

    expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
  });

  it("is not indexed", () => {
    expect(notFoundPageMetadata.robots).toEqual({ index: false });
  });
});
