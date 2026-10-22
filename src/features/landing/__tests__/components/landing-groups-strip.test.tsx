import { render, screen } from "@testing-library/react";
import { LandingGroupsStrip } from "@features/landing/components/landing-groups-strip";

describe("LandingGroupsStrip", () => {
  it("renders one item per group label", () => {
    render(<LandingGroupsStrip groups={["IDYGS 101", "IDYGS 102"]} />);

    expect(screen.getByRole("list", { name: "Grupos participantes" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["IDYGS 101", "IDYGS 102"]);
  });

  it("draws the rules between groups without adding list items", () => {
    const { container } = render(<LandingGroupsStrip groups={["IDYGS 101", "IDYGS 102", "IDYGS 103"]} />);

    expect(container.querySelectorAll("li > span[aria-hidden='true']")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
