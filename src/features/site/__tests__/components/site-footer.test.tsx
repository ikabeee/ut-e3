import { render, screen } from "@testing-library/react";
import { SiteFooterView } from "@features/site/components/site-footer";
import { siteConfig } from "@shared/lib/site-config";

describe("SiteFooterView", () => {
  it("no renderiza el pie en la portada", () => {
    render(<SiteFooterView pathname="/" />);

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("renderiza el pie con el nombre del showcase en las demás rutas", () => {
    render(<SiteFooterView pathname="/games" />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent(siteConfig.title);
  });

  it("no renderiza el pie en el panel de administración", () => {
    render(<SiteFooterView pathname="/admin" />);

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});
