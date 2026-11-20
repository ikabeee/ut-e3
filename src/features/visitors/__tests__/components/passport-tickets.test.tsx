import { render, screen } from "@testing-library/react";
import { PassportTickets } from "@features/visitors/components/passport-tickets";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.tickets;

describe("PassportTickets", () => {
  it("shows each ticket with its global number and the milestone it was earned at (RF-22)", () => {
    render(
      <PassportTickets
        tickets={[
          { number: 41, milestone: 9 },
          { number: 77, milestone: 18 },
        ]}
      />,
    );

    expect(screen.getByText(COPY.ticket(41))).toBeInTheDocument();
    expect(screen.getByText(COPY.ticket(77))).toBeInTheDocument();
    expect(screen.getByText(COPY.milestone(9))).toBeInTheDocument();
  });

  it("names the ticket of the KOF entry, active or voided", () => {
    render(
      <PassportTickets
        tickets={[
          { number: 5, milestone: 0 },
          { number: 6, milestone: 0, voided: true },
        ]}
      />,
    );

    expect(screen.getAllByText("Boleto del torneo KOF")).toHaveLength(1);
    expect(screen.getByText("Anulado: no te presentaste al check-in del torneo KOF")).toBeInTheDocument();
  });

  it("explains when tickets are granted while the visitor has none", () => {
    render(<PassportTickets tickets={[]} />);

    expect(screen.getByText(COPY.empty)).toBeInTheDocument();
  });
});
