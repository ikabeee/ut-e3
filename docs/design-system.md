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
| Cajas del exhibidor 3D (`--utg-case-border`, `--utg-case-face`, `--utg-case-edge`) | `#D6D6D6` / `#0B0B0D` / `#BDBDBD` | `border-case-border`, `bg-case-face`; el canto en `coverflow-edge` |
| Fondo del rack (`--utg-rack-top`, `--utg-rack-bottom`) | `#1E1E20` / `#0C0C0D` | `coverflow-rack` |
| Sombra de una portada sobre otras | negro al 70 % | `shadow-cover` |

Las transparencias se arman con `color-mix()` sobre un token (por ejemplo,
`color-mix(in srgb, var(--utg-black) 75%, transparent)`), nunca con `rgba()` fijo. Si un color
tiene que leerse desde TypeScript (por ejemplo, para la Web Animations API), se lee del tema con
`getComputedStyle` en lugar de repetir el valor: así lo hace `usePlanFlash`.

## Tipografía

| Uso | Familia | Clase |
| --- | --- | --- |
| Títulos | Syncopate | `font-wide`, `type-wide`, `type-giant`; `type-section` para los títulos de sección del detalle |
| Texto corrido | Archivo | `font-sans` (por defecto) |
| Etiquetas, botones y datos | JetBrains Mono | `font-mono`, `type-mono`, `type-tiny` |
| Navegación | Martian Mono | `font-nav` |

Utilidades en `src/shared/styles/typography.css`: `page-wrap` (contenedor de 1600 px con
márgenes), `section-block` (espacio entre secciones) y `scrollbar-none`.

## Componentes

| Necesito... | Usa |
| --- | --- |
| Botón | `Button` de HeroUI: `primary` (azul), `outline` (borde blanco), `tertiary` (sin borde), `ghost` (flecha); `size="lg"` es la pestaña sin borde |
| Selección on/off (géneros, filtros, pausa) | `ToggleButton` de HeroUI con su variante (ver abajo) |
| Buscador | `SearchField` de HeroUI |
| Barra de controles | `Toolbar` de HeroUI |
| Insignia | `Chip` de HeroUI |

## Variantes

Una variante es una clase con nombre en `src/shared/styles/components.css` (BEM de HeroUI) que se
suma a la variante de HeroUI. Cambiar el aspecto de un control se hace ahí, en un solo lugar.

| Componente | Clase | Dónde se usa |
| --- | --- | --- |
| `Button` | `button--plate` | Flechas del exhibidor 3D: placa negra que se rellena de blanco. |
| `Button` | `button--overlay` | Flechas sobre una imagen (galería del detalle): negro translúcido, sin barrido. |
| `Button` | `button--segment` | Celdas de una barra de controles (zoom del croquis): el fondo cambia de golpe a azul. |
| `ToggleButton` | `toggle-button--tile` | Tarjeta seleccionable (géneros del catálogo). |
| `ToggleButton` | `toggle-button--filter` | Filtro que se atenúa al apagarse (categorías del croquis). |
| `ToggleButton` | `toggle-button--overlay` | Botón de ícono sobre un video (pausa del reel). |

Todos los `ToggleButton` son cuadrados y no se escalan al presionar (regla de `.toggle-button`).

**Regla práctica: si una cadena de utilidades supera dos renglones o se repite, es una variante.**
En `className` quedan sólo los ajustes de layout del contexto (posición, tamaño, márgenes), por
ejemplo `<Button className="button--overlay absolute top-1/2 left-3" />`. No sobrescribas las
variables del botón (`--btn-base`, `--btn-edge`, `--btn-fill`) desde TSX ni exportes cadenas de
clases para que otro componente las reutilice: crea la variante o una utilidad.

### Degradados y exhibidor

Utilidades de `components.css` para leer texto sobre imágenes y para el exhibidor 3D:

| Utilidad | Uso |
| --- | --- |
| `shade-cover` | Portada de una caja del exhibidor. |
| `coverflow-rack`, `coverflow-edge`, `coverflow-glow`, `coverflow-reflection` | Fondo del rack, cantos, brillo de la caja al frente y reflejo tenue. |

## Efectos

Definidos en `src/shared/styles/components.css`:

- **Relleno de izquierda a derecha** al pasar el mouse en botones (`.button`) y `fill-wipe`.
- **Texto que se decodifica** al pasar el mouse: `ScrambleText` (los lectores de pantalla leen
  el texto real).
- **Flechas que se desplazan** hacia su dirección: `ArrowGlyph` (`arrow-glyph`).
- **Subrayado que se dibuja**: `link-wipe`.
- **Interferencia** en el icono del CTA principal: `glitch-layer-*`.
- Animaciones `animate-rise` (títulos) y `animate-flash` (stands).

Todo respeta `prefers-reduced-motion`. Los efectos de `hover` sólo se activan con mouse
(`@media (hover: hover)`), para que en pantallas táctiles no se queden "pegados" tras un toque.

## Áreas táctiles

Todo elemento interactivo mide al menos 44x44 px en pantallas táctiles (ver "Móvil primero" en
`AGENTS.md`):

- `touch-target` (`components.css`): pseudo-elemento invisible que amplía el área sin cambiar el
  tamaño visual. El elemento debe ser `relative` o `absolute`.
- `pointer-coarse:min-h-11`: agranda el elemento sólo con dedo (filtros y directorio del croquis).
- Croquis (SVG): `touch-target` no funciona dentro de un SVG y el dibujo se achica con el ancho
  del teléfono. Cada stand y zona lleva junto a su grupo un rectángulo transparente que calcula
  `getTouchRects` (`floor-plan/lib/plan-touch-areas.ts`): crece hasta `TOUCH_MARGIN` unidades
  por lado sin pasar de la mitad del espacio hasta su vecino, así que nunca invade otra zona. Sólo
  existe con dedo (`hidden pointer-coarse:block`), de modo que con mouse el hover, el clic y el
  anillo de foco siguen el dibujo. Los textos decorativos del croquis (pasillos, "ENTRADA",
  "PÚBLICO") llevan `pointer-events-none` para no tapar esas áreas. La prueba
  `__tests__/lib/plan-touch-areas.test.ts` verifica 44 px a 360 px y que no haya solapes.
- Campos de texto: `text-base` (16 px) y, si el diseño pide 14 px, `pointer-fine:text-sm`.

## Notas de implementación

- `tailwind-merge` (usado por `cn`) descarta `leading-*` si una clase de tamaño de texto viene
  después: pon el tamaño antes que el interlineado.
- Las flechas de texto (← → ↗) no están en JetBrains Mono; se dibujan con `ui-monospace`, como
  en el diseño.
