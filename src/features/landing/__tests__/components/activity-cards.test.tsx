import { render, screen } from "@testing-library/react";
import { ActivityCards } from "@features/landing/components/activity-cards";

const RAFFLE = { startsAtLabel: "18:00", cutoffLabel: "16:30" };

const KOF = { opensAtLabel: "13.11.2026", closesAtLabel: "15:00" };

function renderCards() {
  return render(<ActivityCards raffle={RAFFLE} kof={KOF} marketplace={<p>Contenido del marketplace</p>} />);
}

function cardTextOf(headingName: string) {
  let card = screen.getByRole("heading", { level: 3, name: headingName });

  while (card.parentElement && card.parentElement.querySelectorAll("h3").length === 1) {
    card = card.parentElement;
  }

  return card.textContent ?? "";
}

describe("ActivityCards", () => {
  it("lists the four cards in order: Rifa, Marketplace, Torneo de KOF, Mario Kart", () => {
    renderCards();

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

    expect(headings).toEqual(["Rifa", "Marketplace", "Torneo de KOF", "Mario Kart"]);
  });

  it("explains the raffle tickets at 9 and 18 visits, the cutoff and the start time", () => {
    renderCards();

    const raffle = cardTextOf("Rifa");

    expect(raffle).toMatch(/\b9\b/);
    expect(raffle).toMatch(/\b18\b/);
    expect(raffle).toMatch(/visitas/i);
    expect(raffle).toContain(RAFFLE.cutoffLabel);
    expect(raffle).toContain(RAFFLE.startsAtLabel);
  });

  it("explains the KOF tournament: 64 players and the registration window", () => {
    renderCards();

    const kof = cardTextOf("Torneo de KOF");

    expect(kof).toMatch(/\b64\b/);
    expect(kof).toContain(KOF.opensAtLabel);
    expect(kof).toContain(KOF.closesAtLabel);
  });

  it("renders the marketplace slot inside the Marketplace card only", () => {
    renderCards();

    expect(cardTextOf("Marketplace")).toContain("Contenido del marketplace");
    expect(cardTextOf("Mario Kart")).not.toContain("Contenido del marketplace");
  });

  it("keeps Mario Kart informative, without links", () => {
    renderCards();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
