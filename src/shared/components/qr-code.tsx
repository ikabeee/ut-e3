import { cn } from "@heroui/react";
import { buildQrCode } from "@shared/lib/qr-code";

interface QrCodeProps {
  /** Texto que codifica el QR (una URL). */
  value: string;
  /** Descripción para lectores de pantalla. */
  label: string;
  className?: string;
}

/** Zona de silencio alrededor del código (4 módulos, la que pide el estándar). */
const QUIET_ZONE = 4;

/**
 * Código QR en SVG, negro sobre blanco para que lo lea cualquier escáner aunque el sitio
 * use el tema oscuro. Es un Server Component: no manda JavaScript al navegador.
 */
export function QrCode({ value, label, className }: Readonly<QrCodeProps>) {
  const { size, path } = buildQrCode(value);
  const side = size + QUIET_ZONE * 2;

  return (
    <svg
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${side} ${side}`}
      role="img"
      aria-label={label}
      className={cn("block h-auto w-full [shape-rendering:crispEdges]", className)}
    >
      <rect x={-QUIET_ZONE} y={-QUIET_ZONE} width={side} height={side} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
