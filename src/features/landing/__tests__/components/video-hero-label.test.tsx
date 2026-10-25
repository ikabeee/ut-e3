import { render, screen } from "@testing-library/react";
import { VideoHero } from "@features/landing/components/video-hero";

describe("VideoHero landmark", () => {
  it("labels the hero banner with the event name", () => {
    render(<VideoHero calendarUrl="https://calendar.google.com/calendar/render?action=TEMPLATE" />);

    expect(screen.getByRole("banner", { name: "PIXEL & CODE" })).toBeInTheDocument();
  });
});
