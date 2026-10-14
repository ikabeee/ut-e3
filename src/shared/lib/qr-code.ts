import qrcode from "qrcode-generator";

export interface QrCodeGeometry {
  /** Módulos por lado, sin la zona de silencio. */
  size: number;
  /** Trazo SVG de los módulos oscuros: un rectángulo de 1 de alto por cada tramo de un renglón. */
  path: string;
}

/**
 * Geometría de un código QR para dibujarlo como SVG (en el servidor, sin JavaScript en el
 * navegador). Usa corrección de errores "M" (15%): se sigue leyendo desde una captura de
 * pantalla con poco brillo o un poco borrosa.
 */
export function buildQrCode(text: string): QrCodeGeometry {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  const segments: string[] = [];

  for (let row = 0; row < size; row += 1) {
    let col = 0;

    while (col < size) {
      if (!qr.isDark(row, col)) {
        col += 1;
        continue;
      }

      const start = col;

      while (col < size && qr.isDark(row, col)) col += 1;
      const length = col - start;
      segments.push(`M${start} ${row}h${length}v1h-${length}z`);
    }
  }

  return { size, path: segments.join("") };
}
