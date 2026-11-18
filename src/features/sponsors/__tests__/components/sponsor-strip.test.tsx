import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorTickets } from "@features/sponsors/components/sponsor-tickets";

function getTrack() {
  return screen.getByRole("list", { name: "Patrocinadores del evento" });
}

function stubScroll(track: HTMLElement, metrics: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
  const scrollBy = jest.fn();
  const scrollTo = jest.fn();

  Object.defineProperty(track, "scrollLeft", { value: metrics.scrollLeft, configurable: true });
  Object.defineProperty(track, "clientWidth", { value: metrics.clientWidth, configurable: true });
  Object.defineProperty(track, "scrollWidth", { value: metrics.scrollWidth, configurable: true });
  track.scrollBy = scrollBy;
  track.scrollTo = scrollTo;

  return { scrollBy, scrollTo };
}

describe("SponsorTickets as one strip (S7)", () => {
  it("renders a single track with every sponsor in order", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    expect(screen.getAllByRole("list")).toHaveLength(1);

    const names = within(getTrack())
      .getAllByRole("listitem")
      .map((ticket) => within(ticket).getByRole("heading", { level: 3 }).textContent);

    expect(names).toEqual(["Pixel Forge", "North Byte", "Code Lab"]);
  });

  it("makes the track a horizontal scroller that snaps ticket by ticket", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    expect(getTrack()).toHaveClass("overflow-x-auto", "snap-x", "flex");
    expect(getTrack()).not.toHaveClass("grid");
  });

  it("has previous and next controls", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    expect(screen.getByRole("button", { name: "Patrocinadores anteriores" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Patrocinadores siguientes" })).toBeInTheDocument();
  });

  it("scrolls the track forward and back by most of its width", async () => {
    const user = userEvent.setup();
    render(<SponsorTickets sponsors={SPONSORS} />);
    const { scrollBy } = stubScroll(getTrack(), { scrollLeft: 100, clientWidth: 500, scrollWidth: 1500 });

    await user.click(screen.getByRole("button", { name: "Patrocinadores siguientes" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 400 });

    await user.click(screen.getByRole("button", { name: "Patrocinadores anteriores" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -400 });
  });

  it("goes back to the first ticket when next is pressed at the end, and to the last one when previous is pressed at the start", async () => {
    const user = userEvent.setup();
    render(<SponsorTickets sponsors={SPONSORS} />);
    const atEnd = stubScroll(getTrack(), { scrollLeft: 1000, clientWidth: 500, scrollWidth: 1500 });

    await user.click(screen.getByRole("button", { name: "Patrocinadores siguientes" }));
    expect(atEnd.scrollTo).toHaveBeenLastCalledWith({ left: 0 });

    const atStart = stubScroll(getTrack(), { scrollLeft: 0, clientWidth: 500, scrollWidth: 1500 });

    await user.click(screen.getByRole("button", { name: "Patrocinadores anteriores" }));
    expect(atStart.scrollTo).toHaveBeenLastCalledWith({ left: 1000 });
  });

  it("keeps the tickets of the one-sponsor case and no controls to press", () => {
    render(<SponsorTickets sponsors={[SPONSORS[0]]} />);

    expect(within(getTrack()).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
