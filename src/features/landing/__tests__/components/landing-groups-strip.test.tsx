import { render, screen } from "@testing-library/react";
import { LandingGroupsStrip } from "@features/landing/components/landing-groups-strip";

describe("LandingGroupsStrip", () => {
  it("renders one item per group label", () => {
    render(<LandingGroupsStrip groups={["IDYGS 101", "IDYGS 102"]} />);

    expect(screen.getByRole("list", { name: "Grupos participantes" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["IDYGS 101", "IDYGS 102"]);
  });
});
