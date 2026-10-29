import { render, screen } from "@testing-library/react";
import { NotFoundPage, notFoundPageMetadata } from "@features/site/pages/not-found-page";

describe("NotFoundPage", () => {
  it("explains the error and links back home", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute("href", "/");
  });

  it("shows the site navbar with only Inicio", () => {
    render(<NotFoundPage />);

    const navigation = screen.getByRole("navigation");

    expect(navigation).toHaveTextContent("Inicio");
    expect(screen.getAllByRole("link", { name: "Inicio" })).toHaveLength(1);
  });

  it("is not indexed", () => {
    expect(notFoundPageMetadata.robots).toEqual({ index: false });
  });
});
