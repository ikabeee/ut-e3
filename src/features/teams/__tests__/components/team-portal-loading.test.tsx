import { render, screen } from "@testing-library/react";
import { TeamPortalLoading } from "@features/teams/components/team-portal-loading";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";

describe("TeamPortalLoading", () => {
  it("renders a spinner with accessible label instead of plain text copy", () => {
    render(<TeamPortalLoading />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", TEAMS_COPY.page.loading);
  });
});
