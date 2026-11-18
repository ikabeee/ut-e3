/**
 * @jest-environment node
 */
import { renderEmailHtml } from "@shared/lib/server/email-template";

describe("renderEmailHtml (S1)", () => {
  const html = renderEmailHtml({
    subject: "Activa tu cuenta del evento",
    text: "Hola, Ana <b>.\n\nActívala con este enlace:\nhttps://ut.example/activate/abc?x=1&y=2\n\nSi no esperabas este correo, ignóralo.",
  });

  it("is a full document on the black background of the site, without rounded corners", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain("#178fdd");
    expect(html).not.toContain("border-radius");
  });

  it("shows the subject as the heading and the name of the site", () => {
    expect(html).toContain("Activa tu cuenta del evento");
    expect(html).toContain("PIXEL &amp; CODE");
  });

  it("escapes the text, so a name never becomes markup", () => {
    expect(html).toContain("Hola, Ana &lt;b&gt;.");
    expect(html).not.toContain("<b>");
  });

  it("turns a line that is only a link into a button that opens it", () => {
    expect(html).toContain('href="https://ut.example/activate/abc?x=1&amp;y=2"');
  });

  it("keeps each paragraph of the text", () => {
    expect(html).toContain("Si no esperabas este correo, ignóralo.");
  });
});
