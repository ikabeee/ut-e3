import type { ArtColor, Game, GameKeyArt } from "@features/games/lib/types";

/** Variables CSS del tema (src/shared/styles/theme.css) para cada color del arte. */
export const ART_COLOR_VARIABLES: Record<ArtColor, string> = {
  acid: "--utg-acid",
  black: "--utg-black",
  white: "--utg-white",
  panel: "--utg-panel",
  light: "--utg-light",
};

/** Fondos claros: sobre ellos el ruido y los textos se dibujan en negro. */
const LIGHT_BACKGROUNDS: readonly ArtColor[] = ["light", "acid", "white"];

/** Datos del juego que aparecen como "lectura de escáner" en el arte. */
export type ArtLabels = Pick<Game, "stand" | "genre" | "members">;

export interface ArtCanvasContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Resuelve un color de la paleta a un valor CSS. */
  resolveColor: (color: ArtColor) => string;
  /** Familia tipográfica monoespaciada (la de next/font). */
  monoFontFamily: string;
}

/** Medidas compartidas por las capas del arte. */
interface ArtLayout {
  /** Lado menor del lienzo. */
  size: number;
  /** Centro de la figura principal. */
  cx: number;
  cy: number;
  random: () => number;
}

/** Generador pseudoaleatorio xorshift: la misma semilla produce siempre el mismo arte. */
export function createRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function drawBackground({ ctx, width, height }: ArtCanvasContext, ink: string, random: () => number) {
  const cell = Math.max(28, Math.round(Math.min(width, height) / 9));

  // Bloques de píxeles grandes.
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      if (random() < 0.22) {
        ctx.fillStyle = `rgba(${ink},${0.04 + random() * 0.08})`;
        ctx.fillRect(x, y, cell * (1 + Math.trunc(random() * 3)), cell * (1 + Math.trunc(random() * 2)));
      }
    }
  }

  // Retícula fina.
  ctx.strokeStyle = `rgba(${ink},.07)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += cell) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
}

type ShapeDrawer = (canvas: ArtCanvasContext, seed: number, layout: ArtLayout) => void;

/** Cuadros concéntricos con un punto al centro. */
const drawConcentricSquares: ShapeDrawer = ({ ctx }, _seed, { size, cx, cy }) => {
  ctx.lineWidth = Math.max(2, size * 0.012);
  for (let k = 1; k < 7; k += 1) {
    ctx.globalAlpha = k === 3 ? 1 : 0.35;
    ctx.strokeRect(cx - k * size * 0.045, cy - k * size * 0.045, k * size * 0.09, k * size * 0.09);
  }
  ctx.globalAlpha = 1;
  ctx.fillRect(cx - size * 0.03, cy - size * 0.03, size * 0.06, size * 0.06);
};

/** Barras horizontales de ancho aleatorio, como un ecualizador. */
const drawBars: ShapeDrawer = ({ ctx, height }, _seed, { size, cx, random }) => {
  for (let k = 0; k < 12; k += 1) {
    const barWidth = size * (0.08 + random() * 0.5);
    ctx.globalAlpha = k === 6 ? 1 : 0.3;
    ctx.fillRect(cx - barWidth / 2, height * 0.12 + k * size * 0.055, barWidth, size * 0.03);
  }
  ctx.globalAlpha = 1;
};

/** Matriz de puntos en diagonal. */
const drawDotGrid: ShapeDrawer = ({ ctx }, seed, { size, cx, cy }) => {
  const cells = 14;
  const dot = size * 0.034;
  for (let index = 0; index < cells * cells; index += 1) {
    const x = index % cells;
    const y = Math.floor(index / cells);
    if ((x * 7 + y * 3 + seed) % 5 === 0) {
      ctx.globalAlpha = (x + y) % 4 === 0 ? 1 : 0.4;
      ctx.fillRect(cx - size * 0.32 + x * size * 0.046, cy - size * 0.32 + y * size * 0.046, dot, dot);
    }
  }
  ctx.globalAlpha = 1;
};

/** Triángulo con contorno y un triángulo sólido dentro. */
const drawTriangles: ShapeDrawer = ({ ctx }, _seed, { size, cx, cy }) => {
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.28, cy + size * 0.22);
  ctx.lineTo(cx, cy - size * 0.3);
  ctx.lineTo(cx + size * 0.28, cy + size * 0.22);
  ctx.closePath();
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.1, cy + size * 0.08);
  ctx.lineTo(cx, cy - size * 0.1);
  ctx.lineTo(cx + size * 0.1, cy + size * 0.08);
  ctx.closePath();
  ctx.fill();
};

/** Figura principal: cuatro composiciones que se alternan según la semilla. */
const SIGNAL_SHAPES: readonly ShapeDrawer[] = [drawConcentricSquares, drawBars, drawDotGrid, drawTriangles];

/** Columnas de datos tipo escáner; sólo caben en lienzos anchos. */
function drawScanData(canvas: ArtCanvasContext, art: GameKeyArt, labels: ArtLabels, { size, random }: ArtLayout, ink: string) {
  const { ctx, width, height, monoFontFamily } = canvas;
  if (width < 420) {
    return;
  }

  ctx.fillStyle = `rgba(${ink},.55)`;
  ctx.font = `500 ${Math.max(9, Math.round(size * 0.016))}px ${monoFontFamily}`;
  const columns = [
    `STAND ${labels.stand}`,
    `GEN ${labels.genre.toUpperCase()}`,
    `INT 0${labels.members}`,
    `BUILD 0.${3 + art.seed}.${(art.seed * 7) % 10}`,
  ];
  columns.forEach((text, k) => {
    ctx.fillText(text, width * 0.62 + (k % 2) * size * 0.2, height * 0.12 + Math.floor(k / 2) * size * 0.03);
  });
  for (let k = 0; k < 6; k += 1) {
    const reading = String(Math.floor(random() * 99999)).padStart(5, "0");
    ctx.fillText(reading, width * 0.92 - size * 0.02, height * 0.25 + k * size * 0.03);
  }
}

/**
 * Dibuja el arte generado de un juego: retícula de bloques, una figura de "señal",
 * datos de escáner y una mira. Es el `art()` del diseño.
 */
export function drawGameArt(canvas: ArtCanvasContext, art: GameKeyArt, labels: ArtLabels) {
  const { ctx, width, height, resolveColor } = canvas;
  const random = createRandom(700 + art.seed * 97);
  const [shapeColor, backgroundColor] = art.palette;
  const foreground = resolveColor(shapeColor);
  const ink = LIGHT_BACKGROUNDS.includes(backgroundColor) ? "0,0,0" : "255,255,255";

  ctx.fillStyle = resolveColor(backgroundColor);
  ctx.fillRect(0, 0, width, height);
  drawBackground(canvas, ink, random);

  const layout: ArtLayout = { size: Math.min(width, height), cx: width * 0.62, cy: height * 0.42, random };
  const { size, cx, cy } = layout;
  ctx.fillStyle = foreground;
  ctx.strokeStyle = foreground;
  SIGNAL_SHAPES[art.seed % SIGNAL_SHAPES.length](canvas, art.seed, layout);
  drawScanData(canvas, art, labels, layout, ink);

  // Mira.
  ctx.strokeStyle = foreground;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.42, cy);
  ctx.lineTo(cx - size * 0.36, cy);
  ctx.moveTo(cx + size * 0.36, cy);
  ctx.lineTo(cx + size * 0.42, cy);
  ctx.stroke();
}
