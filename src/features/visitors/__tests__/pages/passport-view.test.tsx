import { render, screen } from "@testing-library/react";
import { PassportView } from "@features/visitors/pages/passport-page";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

describe("PassportView", () => {
  it("composes the PIN, the progress, the stands and the tickets of the visitor (RF-19 to RF-22)", () => {
    render(
      <PassportView
        passport={{ gamertag: "PlayerOne", pin: "12345" }}
        visits={{
          visitCount: 9,
          stands: [
            { code: "ZA-S1", visited: true },
            { code: "ZA-S2", visited: false },
          ],
          tickets: [{ number: 3, milestone: 9 }],
        }}
      />,
    );

    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.progress.remaining(9))).toBeInTheDocument();
    expect(screen.getByText("ZA-S2")).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.tickets.ticket(3))).toBeInTheDocument();
  });
});
