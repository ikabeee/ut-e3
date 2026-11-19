import { render, screen } from "@testing-library/react";
import { AreaLink } from "@features/accounts/components/area-link";

describe("AreaLink", () => {
  it("shows a link to the other area inside a labelled navigation", () => {
    render(<AreaLink link={{ href: "/support/recovery", label: "Ir a atención" }} />);

    expect(screen.getByRole("navigation", { name: "Cambiar de área" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a atención" })).toHaveAttribute("href", "/support/recovery");
  });

  it("shows nothing for an account with one role", () => {
    const { container } = render(<AreaLink link={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
