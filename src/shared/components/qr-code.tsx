import { buildQrCode } from "@shared/lib/qr-code";

interface QrCodeImageProps {
  /** What the code opens or says. It is encoded here, in the page, and never sent anywhere. */
  value: string;
  /** The alternative text: what the code is for. */
  label: string;
  className?: string;
}

/**
 * A QR code as an inline SVG. Dark modules on a white square, whatever the theme: phone cameras need that contrast,
 * and the white quiet zone around the modules is part of the code.
 */
export function QrCodeImage({ value, label, className }: Readonly<QrCodeImageProps>) {
  const { size, path } = buildQrCode(value);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      className={`[shape-rendering:crispEdges] ${className ?? ""}`}
      data-qr-modules={size}
    >
      <title>{label}</title>
      <rect width={size} height={size} className="fill-white" />
      <path d={path} className="fill-black" />
    </svg>
  );
}
