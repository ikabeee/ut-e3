import { render, screen } from "@testing-library/react";
import { NotFoundPage, notFoundPageMetadata } from "@features/site/pages/not-found-page";

describe("NotFoundPage", () => {
  it("explains the error and links to the catalog", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver todos los juegos/ })).toHaveAttribute("href", "/games");
  });

  it("is not indexed", () => {
    expect(notFoundPageMetadata.robots).toEqual({ index: false });
  });
});
