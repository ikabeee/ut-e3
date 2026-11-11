const MONO = "var(--font-mono)";
const WIDE = "var(--font-wide)";
const ROAD = "M70 40 C140 140 250 210 300 250 S430 330 470 370";

// Retícula de puntos cada 24 unidades, como en el diseño.
const DOT_STEP = 24;

/** Esquema sin escala: la UT Cancún sobre la carretera entre el centro y el aeropuerto. */
export function VenueMap() {
  return (
    <svg
      viewBox="0 0 600 400"
      role="img"
      aria-label="Esquema: la UT Cancún está sobre la carretera Cancún–Aeropuerto, entre el centro y el aeropuerto"
      className="block h-auto w-full"
    >
      <defs>
        <pattern id="venue-map-dots" x={12} y={12} width={DOT_STEP} height={DOT_STEP} patternUnits="userSpaceOnUse">
          <rect width={1.2} height={1.2} fill="var(--border)" />
        </pattern>
      </defs>
      <rect width={600} height={400} fill="var(--background)" />
      <rect x={12} y={12} width={588} height={388} fill="url(#venue-map-dots)" />
      <path d="M520 0 C500 120 560 220 530 400 H600 V0 Z" fill="var(--surface)" />
      <text x={540} y={30} fontSize={10} fill="var(--muted)" style={{ fontFamily: MONO }}>
        CARIBE
      </text>
      <path d={ROAD} stroke="var(--foreground)" strokeWidth={2} fill="none" />
      <path d={ROAD} stroke="var(--foreground)" strokeWidth={12} strokeOpacity={0.08} fill="none" />
      <rect x={64} y={34} width={12} height={12} fill="var(--foreground)" />
      <rect x={464} y={364} width={12} height={12} fill="var(--foreground)" />
      <text x={88} y={44} fontSize={11} fill="var(--foreground)" style={{ fontFamily: MONO }}>
        CENTRO DE CANCÚN
      </text>
      <text x={366} y={394} fontSize={11} fill="var(--foreground)" style={{ fontFamily: MONO }}>
        AEROPUERTO
      </text>
      <rect x={262} y={142} width={100} height={70} fill="var(--accent)" />
      <text
        x={274}
        y={178}
        fontSize={24}
        fontWeight={900}
        fill="var(--background)"
        style={{ fontFamily: WIDE, fontVariationSettings: "'wdth' 125" }}
      >
        UTG
      </text>
      <text x={274} y={200} fontSize={10} fill="var(--background)" style={{ fontFamily: MONO }}>
        UT CANCÚN
      </text>
      <line x1={300} y1={212} x2={300} y2={248} stroke="var(--accent)" strokeWidth={2} />
      <text x={96} y={282} fontSize={11} fill="var(--accent)" style={{ fontFamily: MONO }}>
        CARR. CANCÚN–AEROPUERTO · KM 11.5
      </text>
      <text x={14} y={390} fontSize={10} fill="var(--muted)" style={{ fontFamily: MONO }}>
        ESQUEMA SIN ESCALA
      </text>
    </svg>
  );
}
