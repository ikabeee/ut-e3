import { render, screen, within } from "@testing-library/react";
import { HelpPage, helpPageMetadata } from "@features/site/pages/help-page";
import { HELP_TOPICS } from "@features/site/lib/help-topics";

describe("HelpPage", () => {
  it("asks who to go to with a single h1 and tells what to do if the problem is not there", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { level: 1, name: "¿A quién acudo?" })).toBeInTheDocument();
    expect(screen.getByText(/acude a la mesa de atención del evento/)).toBeInTheDocument();
  });

  it("shows every topic as a card with its heading and its solution", () => {
    render(<HelpPage />);

    const cards = within(screen.getByRole("list", { name: "Problemas frecuentes" })).getAllByRole("listitem");

    expect(cards).toHaveLength(HELP_TOPICS.length);

    for (const topic of HELP_TOPICS) {
      expect(screen.getByRole("heading", { level: 2, name: topic.title })).toBeInTheDocument();
      expect(screen.getByText(topic.solution)).toBeInTheDocument();
    }
  });

  it("draws one decorative illustration per topic", () => {
    const { container } = render(<HelpPage />);

    const drawings = container.querySelectorAll("svg[aria-hidden=true]");

    expect(drawings).toHaveLength(HELP_TOPICS.length);
  });

  it("links the recovery page and the passport", () => {
    render(<HelpPage />);

    expect(screen.getByRole("link", { name: /Recuperar mi pasaporte/ })).toHaveAttribute("href", "/passport/recover");
    expect(screen.getAllByRole("link", { name: /Abrir mi pasaporte/ })[0]).toHaveAttribute("href", "/passport");
  });
});

describe("helpPageMetadata", () => {
  it("is public and indexable with its own canonical and Open Graph", () => {
    expect(helpPageMetadata.title).toBe("¿A quién acudo?");
    expect(helpPageMetadata.description).toEqual(expect.any(String));
    expect(helpPageMetadata.alternates?.canonical).toBe("/help");
    expect(helpPageMetadata.openGraph).toMatchObject({ url: "/help", type: "website" });
    expect(helpPageMetadata.robots).toBeUndefined();
  });
});
