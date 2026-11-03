import { render, screen } from "@testing-library/react";
import { QrCodeImage } from "@shared/components/qr-code";
import { buildQrCode } from "@shared/lib/qr-code";

const LINK = "https://showcase.example/passport/claim/abc";

describe("QrCodeImage", () => {
  it("is an image for assistive technology, named by its label", () => {
    render(<QrCodeImage value={LINK} label="Código QR para abrir el pasaporte" />);

    expect(screen.getByRole("img", { name: "Código QR para abrir el pasaporte" })).toBeInTheDocument();
    expect(screen.getByTitle("Código QR para abrir el pasaporte")).toBeInTheDocument();
  });

  it("draws the code that the link gives, dark modules on a white square", () => {
    const { container } = render(<QrCodeImage value={LINK} label="QR" />);
    const { path, size } = buildQrCode(LINK);

    expect(container.querySelector("path")).toHaveAttribute("d", path);
    expect(container.querySelector("path")).toHaveClass("fill-black");
    expect(container.querySelector("rect")).toHaveClass("fill-white");
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", `0 0 ${size} ${size}`);
  });

  it("is drawn here: no external image, link or script, and the link is not written in the markup", () => {
    const { container } = render(<QrCodeImage value={LINK} label="QR" />);

    expect(container.querySelector("image, img, a, script, foreignObject")).toBeNull();
    expect(container.innerHTML).not.toContain("showcase.example");
  });
});
