---
status: in-progress
---

# Lanzamiento de la landing a producción con kill switch

Objetivo: publicar hoy solo la landing, con todo lo demás bloqueado, y dejar un entorno de demo con la app completa.
Rama: `feature/event-day-integration` (encima de la integración de la rifa, el sysadmin, el kiosco sin conexión y la
recuperación por correo). Entrega: un PR hacia `develop`. Pruebas: Jest (`npm test`), ESLint, Oxlint, jscpd, typecheck.

## Specs

- **S1. Kill switch.** "Haremos un kill switch para desactivar todo, en lo que nos dan las demas informacion y preparar
  al sistema." "Lo unico que estara en productivo es la landing page, lo demas TIENE QUE ESTAR BLOQUEADO PARA LOS
  USUARIOS."
  - `SITE_MODE=landing` deja pasar solo `GET`/`HEAD` de `/`, `/privacy`, `/manifest.webmanifest`, `/api/health` y los
    archivos estáticos. Las páginas bloqueadas redirigen a `/`, las rutas de `/api` responden 404 y cualquier otro método
    (Server Actions incluidas) responde 405.
  - `SITE_MODE=full` deja la app completa (la protección por sesión de `/admin`, `/stand` y `/support` sigue igual).
  - Sin `SITE_MODE`, producción arranca en `landing` (falla cerrada) y desarrollo en `full`. Un valor inválido detiene
    el build.
  - En `landing`, la landing no enlaza a rutas bloqueadas: la barra usa anclas de la misma página, no hay "Crear mi
    pasaporte" y las cajas del coverflow no abren la ficha. El service worker no se registra.
- **S2. Dos entornos.** "déjame dos entornos. Uno para mostrar como demo a mi maestro de PWA, y otro es el productivo"
  - `docker-compose.yml` levanta cada entorno como un proyecto de Compose distinto (`-p`), con su propio `.env`,
    puerto, volumen e imagen. Producción usa `SITE_MODE=landing` y la demo `SITE_MODE=full`. `docs/deploy.md` lo explica.
- **S3. Contenido real.** "Que este la landing ya hecha con los datos que tenemos sobre los patrocinadores y los juegos."
  "no importa si la landing está hard codeada"
  - Juegos: las 14 carpetas de Drive "Portadas de los juegos" (portada del coverflow como imagen principal y la portada
    horizontal como segunda imagen). Sin datos inventados: Drive no trae género, sinopsis ni stand.
  - Patrocinadores: los de Drive "Informacion de los patrocinadores" que tienen logo (Bonavida, Mermelada, Nemo
    Submarine), con su sitio y teléfono cuando existen.
- **S4. Algorix.** "en patrocinadores agregas mi empresa (Algorix Insights), logos los sacas del repositorio de que
  dentro de repositories de la landing, antes de que coloques algo de los logos de mi empresa sacame el artifact"
  - Artifact publicado antes de colocar el logo: https://claude.ai/artifact/FSF3Sbrb32rSsFFJAMWVES
- **S5. Calidad.** "Que funcione ante carga", "Que sea amigable con los celulares", "que se hagan pruebas de carga, que
  todos los tres unitarios funcionen, que el inter funcione del anti-slope", "no solamente se cumpla el happy path. Yo
  estoy buscando buscar escenarios catastróficos", "cumpla con reglas de UI UX, que no tengan elementos de artifacts de
  inteligencia artificial que son muy notorios", "sea lo más minimalista posible y que no abrumes al usuario".
- **S6. Ramas limpias.** "Al terminar necesito que las ramas esten limpias"

## Tasks

| ID | Specs | Ruta | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1 | inline | hecho | `d5ec147`, `cdbabf8` |
| T2 | S2 | inline | hecho | `d5ec147`, `cdbabf8` |
| T3 | S3, S4 | delegada (subagente Claude; Muse y Gemini no arrancan en el sandbox) + migración inline | hecho | `7018e59` |
| T4 | S5 | inline + dos auditorías de solo lectura | hecho (carga por HTTP pendiente en el VPS) | `b1ce2e1`, `1c2e415`, `cdbabf8` |
| T5 | S6 | inline (requiere el merge del PR) | pendiente | |

## Log

- **L1 (2026-11-09).** Petición original:

  > https://drive.google.com/drive/folders/1ZsImnvoS70XPs6qN1ERIHSv1_uTqbvK2 - Portadas de los juegos
  > https://drive.google.com/drive/folders/1XDTgzVkqPh03_NwqgVcYpsD8OMy7e3In - Informacion de los patrocinadores
  >
  > Como necesito que ya salga a produccion este proyecto. Haremos un kill switch para desactivar todo, en lo que nos
  > dan las demas informacion y preparar al sistema. En lo que corregimos errores.
  >
  > Lo unico que estara en productivo es la landing page, lo demas TIENE QUE ESTAR BLOQUEADO PARA LOS USUARIOS. De paso
  > en patrocinadores agregas mi empresa (Algorix Insights), logos los sacas del repositorio de que dentro de
  > repositories de la landing, antes de que coloques algo de los logos de mi empresa sacame el artifact
  >
  > Sin revision, manda el PR. De todas formas yo me ire a dormir y el objetivo es que se CUMPLAN lo siguiente:
  >
  > 1. Los requerimientos de la aplicacion
  > 2. Que este la landing ya hecha con los datos que tenemos sobre los patrocinadores y los juegos.
  > 3. Que funcione ante carga
  > 4. Que sea amigable con los celulares.
  > 5. Al terminar necesito que las ramas esten limpias
  >
  > (sigue el dictado completo: pruebas de carga, pruebas unitarias, linter anti-slop, código legible, escenarios
  > catastróficos, landing a más tardar hoy, dos entornos, reglas de UI/UX al estilo Apple, usar Gemini y Muse Spark.)
- **L2.** Drive: 14 juegos con imágenes y ninguno con texto; patrocinadores Bonavida, Nemo Submarine y Fresh Air con
  documento de contacto, Mermelada con 5 logos y sin datos, OpSET vacío. Fresh Air no tiene logo y OpSET no tiene nada:
  quedan fuera hasta tener su logo.
- **L3.** Gemini (`agy`) y Muse no arrancan en este sandbox (no pueden abrir un puerto local ni escribir su directorio de
  sesión). El trabajo delegado va a subagentes de Claude.
- **L4.** `gh` no funciona en el sandbox (TLS y keyring): el PR y el merge los corre el usuario con `!`.
- **L5.** El CHECK `sponsors_phone_check` exigía teléfono; Algorix y Mermelada no tienen. La migración
  `20261109120000_sponsor_optional_contact` acepta el teléfono vacío (uno escrito sigue en E.164) y el panel deja sitio,
  teléfono y servicios como opcionales. Mermelada usa `logo-4` (el único completo en alta resolución).
- **L6.** Auditoría de UI/UX: en modo `landing` se quitan "Inicio" (el logo lleva al inicio), CALIFICA, el marketplace y
  las invitadas por anunciar; el croquis abre en el escenario sin juegos; "Agregar al calendario"; `--utg-grey` a
  `#8a8a8a` (AA). Pendientes sugeridos sin aplicar: carrusel de patrocinadores que cambia de alto en móvil, textos de la
  agenda que mencionan el PIN, fecha y sede en el hero.
- **L7.** Auditoría de escenarios catastróficos: ninguna ruta salta el kill switch. Se corrigieron: lista cerrada de
  extensiones públicas (sin `.rsc`), `isGameSlug` antes de consultar la ficha, el contenedor no arranca si su
  `SITE_MODE` no es el de la imagen, y solo WebP en el optimizador. Pendientes: `proxy_pass` con URI en Nginx para
  normalizar `..`, y un `sw.js` que se desregistre si alguna vez hubo un despliegue `full` en el mismo dominio.
- **L8.** El sandbox no permite abrir puertos ni sockets: no hay `next start`, e2e ni prueba de carga por HTTP local.
  `npm run test:load` queda para correrse contra el VPS; la carga local se mide inyectando peticiones en el handler de
  Next dentro del proceso.
- **L9 (2026-11-09).** `next build` local se queda colgado bajando las fuentes de Google (`fonts.gstatic.com` no es
  alcanzable desde el sandbox), así que no hay build local ni carga dentro del proceso; el build lo corre el CI del PR y
  la carga, `npm run test:load` contra el VPS. Verificación: Jest en Node 22 (el del CI) 272 suites y 1976 pruebas en
  verde; `eslint`, `lint:oxlint`, `lint:duplication` y `typecheck` en verde; `format:check` en verde salvo
  `.env.example` y `.env.production.example`, que el sandbox no deja leer y la rama no toca. Siguiente: PR hacia
  `develop` (el usuario lo crea con `gh`) y, tras el merge, T5.
