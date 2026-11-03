import { render, screen } from "@testing-library/react";
import { PASSPORT_SNAPSHOT_KEY } from "@features/visitors/lib/passport-snapshot";
import { RegisterView, registerPageMetadata } from "@features/visitors/pages/register-page";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { REGISTER_PATH } from "@features/visitors/lib/visitors-links";

describe("RegisterPage and RegisterView", () => {
  it("renders form and privacy notice when registration is open", () => {
    render(<RegisterView isOpen={true} registrationOpensAt="2026-11-13T05:00:00.000Z" />);

    expect(screen.getByRole("heading", { level: 1, name: VISITORS_COPY.form.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: VISITORS_COPY.form.submit })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: VISITORS_COPY.privacy.linkText })).toBeInTheDocument();
  });

  it("renders closed notice with formatted date when registration is closed", () => {
    render(<RegisterView isOpen={false} registrationOpensAt="2026-11-20T17:00:00.000Z" />);

    expect(screen.getByRole("heading", { level: 1, name: VISITORS_COPY.form.title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: VISITORS_COPY.form.submit })).not.toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.closed("20.11.2026"))).toBeInTheDocument();
  });

  it("deletes the offline copy of the passport: a phone sent here is no longer an active device (RF-18)", () => {
    window.localStorage.setItem(PASSPORT_SNAPSHOT_KEY, "{}");

    render(<RegisterView isOpen={true} registrationOpensAt="2026-11-13T05:00:00.000Z" />);

    expect(window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY)).toBeNull();
  });

  it("exports valid metadata with canonical /register", () => {
    expect(registerPageMetadata.title).toBe(VISITORS_COPY.form.title);
    expect(registerPageMetadata.alternates?.canonical).toBe(REGISTER_PATH);
  });
});
