import { render, screen } from "@testing-library/react";
import { HelpIllustration } from "@features/site/components/help-illustration";
import { HelpTopicCard } from "@features/site/components/help-topic-card";
import { HELP_TOPICS } from "@features/site/lib/help-topics";

describe("HelpIllustration", () => {
  it.each(HELP_TOPICS.map((topic) => topic.illustration))(
    "draws %s as a decoration hidden from screen readers",
    (id) => {
      const { container } = render(<HelpIllustration id={id} />);

      const drawing = container.querySelector("svg");

      expect(drawing).toHaveAttribute("aria-hidden", "true");
      expect(drawing).toHaveAttribute("focusable", "false");
      expect(drawing?.querySelectorAll("path, circle, rect, line").length).toBeGreaterThan(1);
    },
  );
});

describe("HelpTopicCard", () => {
  it("shows the title as a heading, the solution and the link of the topic", () => {
    const topic = HELP_TOPICS.find(({ id }) => id === "lost-phone")!;

    render(<HelpTopicCard topic={topic} />);

    expect(screen.getByRole("heading", { level: 2, name: topic.title })).toBeInTheDocument();
    expect(screen.getByText(topic.solution)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: topic.link!.label })).toHaveAttribute("href", "/passport/recover");
  });

  it("shows no link when the topic has none", () => {
    const topic = HELP_TOPICS.find(({ id }) => id === "stand-visit")!;

    render(<HelpTopicCard topic={{ ...topic, link: undefined }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
