import { render, screen } from "@testing-library/react";
import { EventIntro } from "@features/landing/components/event-intro";

describe("EventIntro", () => {
  it("shows the giant heading, the two paragraphs and the slot content", () => {
    render(
      <EventIntro>
        <p>Tarjetas</p>
      </EventIntro>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Juegos hechosen la UT Cancún");
    expect(screen.getByText(/presentan los videojuegos que desarrollaron/)).toBeInTheDocument();
    expect(screen.getByText(/La entrada es libre/)).toBeInTheDocument();
    expect(screen.getByText("Tarjetas")).toBeInTheDocument();
  });
});
