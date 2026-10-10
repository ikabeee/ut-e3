# Sistema de diseño UTG

El diseño (carpeta UTG) tiene un solo tema oscuro: campo negro, bloques en azul "acid",
títulos anchos en mayúsculas y texto monoespaciado. Se implementa sobre **HeroUI v3**: los
componentes de HeroUI conservan su accesibilidad (React Aria) y toman la apariencia del diseño
desde el tema.

## Colores

Definidos en `src/shared/styles/theme.css`. Usa siempre las clases del tema, no colores fijos.

| Token del diseño | Valor | Clase de Tailwind |
| --- | --- | --- |
| `--black` | `#000000` | `bg-background`, `text-background` |
| `--white` | `#FFFFFF` | `text-foreground` |
| `--panel` | `#1C1C1C` | `bg-surface`, `border-separator` |
| `--mid` | `#3A3A3A` | `border-border` |
| `--grey` | `#717171` | `text-muted` |
| `--acid` | `#178FDD` | `bg-accent`, `text-accent` |
| `--light` | `#F4F4F4` | `bg-paper` (con `text-paper-foreground`) |
| `--blue-1` / `--blue-4` / `--blue-5` | `#68B5E6` / `#0582D4` / `#04598F` | `accent-hi`, `accent-strong`, `accent-deep` |
| Grises de texto secundario | `#D8D8D8`, `#E4E4E4`, `#C9C8C1`, `#BDBDBD` | `text-copy`, `text-copy-strong`, `text-copy-warm`, `text-copy-dim` |

## Tipografía

| Uso | Familia | Clase |
| --- | --- | --- |
| Títulos | Syncopate | `font-wide`, `type-wide`, `type-giant` |
| Texto corrido | Archivo | `font-sans` (por defecto) |
| Etiquetas, botones y datos | JetBrains Mono | `font-mono`, `type-mono`, `type-tiny` |
| Navegación | Martian Mono | `font-nav` |

Utilidades en `src/shared/styles/typography.css`: `page-wrap` (contenedor de 1600 px con
márgenes), `section-block` (espacio entre secciones) y `scrollbar-none`.

## Componentes

| Necesito... | Usa |
| --- | --- |
| Botón | `Button` de HeroUI: `primary` (azul), `outline` (borde blanco), `tertiary` (sin borde), `ghost` (flecha); `size="lg"` es la pestaña sin borde |
| Botón con etiqueta animada | `ActionButton` (`@shared/components/action-button`) |
| Enlace con forma de botón | `ActionLink` (`@shared/components/action-link`) |
| Flechas de carrusel | `ArrowButton` (`@shared/components/arrow-button`) |
| Tarjeta clara | `PaperCard` (Card de HeroUI con el fondo `paper`) |
| Selección on/off (géneros, filtros, pausa) | `ToggleButton` de HeroUI |
| Buscador | `SearchField` de HeroUI |
| Barra de controles | `Toolbar` de HeroUI |
| Insignia | `Chip` de HeroUI |
| Estado vacío / carga | `EmptyState` y `Skeleton` de HeroUI |

## Efectos

Definidos en `src/shared/styles/components.css`:

- **Relleno de izquierda a derecha** al pasar el mouse en botones (`.button`) y `fill-wipe`.
- **Texto que se decodifica** al pasar el mouse: `ScrambleText` (los lectores de pantalla leen
  el texto real).
- **Flechas que se desplazan** hacia su dirección: `ArrowGlyph` (`arrow-glyph`).
- **Subrayado que se dibuja**: `link-wipe`.
- **Interferencia** en el icono del CTA principal: `glitch-layer-*`.
- Animaciones `animate-rise` (títulos) y `animate-flash` (stands).

Todo respeta `prefers-reduced-motion`.

## Notas de implementación

- `tailwind-merge` (usado por `cn`) descarta `leading-*` si una clase de tamaño de texto viene
  después: pon el tamaño antes que el interlineado.
- Las flechas de texto (← → ↗) no están en JetBrains Mono; se dibujan con `ui-monospace`, como
  en el diseño.
