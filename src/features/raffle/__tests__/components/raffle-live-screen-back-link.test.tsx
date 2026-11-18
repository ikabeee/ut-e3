import { render, screen } from "@testing-library/react";
import { RaffleLiveScreen } from "@features/raffle/components/raffle-live-screen";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { createLiveSnapshot } from "@features/raffle/__tests__/components/raffle-test-snapshots";

describe("RaffleLiveScreen chrome (S29)", () => {
  it("has no fullscreen button and no Tómbola en vivo label", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot()} load={jest.fn()} />);

    expect(screen.queryByRole("button", { name: "Pantalla completa" })).not.toBeInTheDocument();
    expect(screen.queryByText("Pantalla completa")).not.toBeInTheDocument();
    expect(screen.queryByText("Tómbola en vivo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the back link without underline and with a hover and focus state", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot()} load={jest.fn()} />);

    const back = screen.getByRole("link", { name: "Volver a los ganadores" });

    expect(back).toHaveClass("no-underline", "hover:text-accent", "focus-visible:text-accent");
    expect(back).not.toHaveClass("underline");
  });

  it("fits under the site navbar instead of taking the whole screen height (S28)", () => {
    const { container } = render(<RaffleLiveScreen initial={createLiveSnapshot()} load={jest.fn()} />);

    expect(container.firstElementChild).toHaveClass("min-h-[calc(100svh-var(--nav-height))]");
  });
});

describe("RaffleLiveScreen back link (S8)", () => {
  it("shows a visible 44 px link back to /raffle", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot()} load={jest.fn()} />);

    const back = screen.getByRole("link", { name: "Volver a los ganadores" });

    expect(back).toHaveAttribute("href", RAFFLE_WINNERS_PATH);
    expect(back).toHaveClass("min-h-11");
  });

  it("still lists the confirmed winners next to the way out", () => {
    const winners = [
      {
        drawId: "a",
        ticketNumber: 3,
        gamertag: "Trinity",
        decidedAt: "2026-11-20T23:06:00.000Z",
        prizeName: "Taza",
      },
    ];

    render(<RaffleLiveScreen initial={createLiveSnapshot({ phase: "closed", winners })} load={jest.fn()} />);

    expect(screen.getByText("Taza")).toBeInTheDocument();
  });
});
