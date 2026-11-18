import "server-only";
import { siteConfig } from "@shared/lib/site-config";

export interface EmailBody {
  subject: string;
  text: string;
}

// The colors of src/shared/styles/theme.css (--utg-black, --utg-panel, --utg-white, --utg-acid, --utg-grey). Email
// clients do not load the fonts of the site, so each stack falls back to a web-safe font of the same character.
const COLORS = { black: "#000000", panel: "#1c1c1c", white: "#ffffff", accent: "#178fdd", muted: "#8a8a8a" };

const DISPLAY_FONT = "Syncopate, 'Arial Black', Arial, sans-serif";

const BODY_FONT = "Archivo, Arial, Helvetica, sans-serif";

const MONO_FONT = "'JetBrains Mono', 'Courier New', Courier, monospace";

const LINK_LINE = /^https?:\/\/\S+$/;

const BUTTON_LABEL = "Abrir el enlace";

/**
 * The HTML version of every email: the plain text of the email laid out on the black page of the site (tables and
 * inline styles, the only layout email clients agree on). A line that is only a link becomes a button. The plain text
 * still travels as the alternative part.
 */
export function renderEmailHtml({ subject, text }: EmailBody): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="es"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">',
    `<title>${escapeHtml(subject)}</title></head>`,
    `<body style="margin:0;padding:0;background-color:${COLORS.black};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.black}">`,
    '<tr><td align="center" style="padding:32px 16px;">',
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">`,
    renderHeader(),
    renderHeading(subject),
    ...splitParagraphs(text).map(renderParagraph),
    renderFooter(),
    "</table></td></tr></table></body></html>",
  ].join("");
}

function renderHeader(): string {
  return (
    `<tr><td style="padding:0 0 24px;border-bottom:4px solid ${COLORS.accent};font-family:${DISPLAY_FONT};` +
    `font-size:14px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:${COLORS.white};">` +
    `${escapeHtml(siteConfig.name)}</td></tr>`
  );
}

function renderHeading(subject: string): string {
  return (
    `<tr><td style="padding:32px 0 16px;font-family:${DISPLAY_FONT};font-size:22px;line-height:1.3;` +
    `font-weight:700;text-transform:uppercase;color:${COLORS.white};">${escapeHtml(subject)}</td></tr>`
  );
}

function splitParagraphs(text: string): string[][] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n").filter((line) => line.trim().length > 0))
    .filter((lines) => lines.length > 0);
}

function renderParagraph(lines: string[]): string {
  const parts = lines.map((line) => (LINK_LINE.test(line.trim()) ? renderButton(line.trim()) : escapeHtml(line)));

  return (
    `<tr><td style="padding:0 0 16px;font-family:${BODY_FONT};font-size:16px;line-height:1.6;` +
    `color:${COLORS.white};">${parts.join("<br>")}</td></tr>`
  );
}

// A table cell keeps the background in Outlook, where a padded link alone loses it. The link stays visible under the
// button for clients that block it or for copying it by hand.
function renderButton(url: string): string {
  const href = escapeHtml(url);

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">` +
    `<tr><td bgcolor="${COLORS.accent}" style="background-color:${COLORS.accent};">` +
    `<a href="${href}" style="display:inline-block;padding:14px 24px;font-family:${DISPLAY_FONT};font-size:13px;` +
    `font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${COLORS.black};text-decoration:none;">` +
    `${BUTTON_LABEL}</a></td></tr></table>` +
    `<span style="font-family:${MONO_FONT};font-size:12px;color:${COLORS.muted};word-break:break-all;">${href}</span>`
  );
}

function renderFooter(): string {
  return (
    `<tr><td style="padding:24px 0 0;border-top:1px solid ${COLORS.panel};font-family:${MONO_FONT};font-size:12px;` +
    `line-height:1.6;color:${COLORS.muted};">${escapeHtml(siteConfig.organizationLabel)}</td></tr>`
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
