import { existsSync } from "node:fs";
import path from "node:path";
import { HELP_PATH, HELP_TOPICS } from "@features/site/lib/help-topics";

const APP_DIRECTORY = path.join(process.cwd(), "src", "app");

describe("HELP_PATH", () => {
  it("is the public page /help", () => {
    expect(HELP_PATH).toBe("/help");
    expect(existsSync(path.join(APP_DIRECTORY, "help", "page.tsx"))).toBe(true);
  });
});

describe("HELP_TOPICS", () => {
  it("covers the problems of a visitor, in order", () => {
    expect(HELP_TOPICS.map((topic) => topic.id)).toEqual([
      "lost-phone",
      "no-email",
      "stand-visit",
      "tickets",
      "kof",
      "offline",
    ]);
  });

  it("gives each topic a title, a one-line solution and its own illustration", () => {
    for (const topic of HELP_TOPICS) {
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.solution.length).toBeGreaterThan(0);
      expect(topic.solution.length).toBeLessThanOrEqual(110);
      expect(topic.illustration).toBe(topic.id);
    }
  });

  it("keeps every link on a page of the app", () => {
    for (const link of HELP_TOPICS.flatMap((topic) => (topic.link ? [topic.link] : []))) {
      expect(link.label.length).toBeGreaterThan(0);
      expect(link.href).toMatch(/^\/[a-z/-]*$/);
      expect(existsSync(path.join(APP_DIRECTORY, link.href, "page.tsx"))).toBe(true);
    }
  });

  it("sends the lost phone to the recovery page and the desk", () => {
    const topic = HELP_TOPICS.find(({ id }) => id === "lost-phone");

    expect(topic?.link?.href).toBe("/passport/recover");
    expect(topic?.solution).toContain("mesa de atención");
  });

  it("tells the visitor to warn the staff of that stand when a visit did not register", () => {
    const topic = HELP_TOPICS.find(({ id }) => id === "stand-visit");

    expect(topic?.solution).toMatch(/staff del stand/);
  });

  it("points the tickets to the passport and the KOF registration to its button", () => {
    const tickets = HELP_TOPICS.find(({ id }) => id === "tickets");
    const kof = HELP_TOPICS.find(({ id }) => id === "kof");

    expect(tickets?.solution).toContain("Boletos");
    expect(kof?.solution).toContain("Inscribirme al torneo");
  });

  it("explains that the passport opens without a connection from the saved copy", () => {
    const topic = HELP_TOPICS.find(({ id }) => id === "offline");

    expect(topic?.solution).toMatch(/copia guardada/);
    expect(topic?.link?.href).toBe("/passport");
  });

  it("speaks only to the visitor: no staff roles nor internal tools", () => {
    const text = HELP_TOPICS.map((topic) => `${topic.title} ${topic.solution}`).join(" ");

    expect(text).not.toMatch(/sysadmin|administrador|panel|kiosko|bit[aá]cora|help.?desk|cuenta/i);
  });
});
