import { render, screen, within } from "@testing-library/react";
import { NotFoundPage, notFoundPageMetadata } from "@features/site/pages/not-found-page";

describe("NotFoundPage", () => {
  it("explains the error and links back home", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute("href", "/");
  });

  it("shows the site navbar with Inicio and Juegos", () => {
    render(<NotFoundPage />);

    const navigation = within(screen.getByRole("navigation"));

    expect(navigation.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(navigation.getByRole("link", { name: "Juegos" })).toHaveAttribute("href", "/games");
  });

  it("is not indexed", () => {
    expect(notFoundPageMetadata.robots).toEqual({ index: false });
  });
});
