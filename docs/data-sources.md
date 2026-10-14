# Fuentes de datos y base de datos local

## Base de datos local (Docker)

El modelo está en [`data-model.md`](./data-model.md) y su contrato de Prisma 8 en
`src/shared/lib/prisma/contract.prisma`. `docker-compose.yml` levanta PostgreSQL 16 con los
valores de `.env.example`.

```bash
cp .env.example .env              # una sola vez
docker compose up -d --wait db    # PostgreSQL en localhost:5432
npm run db:migrate                # aplica las migraciones de migrations/app/
npm run db:seed                   # géneros, plataformas y los 18 equipos con su juego
npm run dev
```

- **Base en Docker**: `npm run docker:up` (o `docker compose up -d --wait db`)
  levanta PostgreSQL en `localhost:5432`. `npm run docker:down` lo detiene. Luego corre
  `npm run db:migrate` y `npm run db:seed` en tu máquina para aplicar las migraciones y seeds.
- **Seeds** (`src/shared/lib/prisma/seed.ts` y `seed-data.json`): se pueden correr varias
  veces, no duplican ni modifican lo que ya existe. Carga los 18 equipos con su juego; las
  portadas están en `public/games/`.
- **Llaves de escáner**: el seed genera una llave aleatoria por equipo nuevo y la imprime una
  sola vez; la base sólo guarda su hash. Si las pierdes en tu base local, bórrala y vuelve a
  sembrar.
- **Empezar de cero**: `docker compose down -v` borra el volumen con los datos.
- **Puertos ocupados**: cambia `POSTGRES_PORT` en `.env` (y el puerto de
  `DATABASE_URL`).

### Cambiar el modelo

1. Edita `contract.prisma` y ejecuta `npm run db:emit` (lee antes
   `node_modules/@prisma/orm-postgres/skills/prisma-8/`).
2. En tu base local puedes probar con `npm run db:update` (no escribe migraciones).
3. Antes del PR genera la migración formal con `npm run db:migration:plan -- --name <cambio>`,
   revisa `migrations/app/<fecha>_<cambio>/` y súbela junto con el contrato.
4. `npm run db:migrate` la aplica. El CI levanta PostgreSQL, aplica las migraciones, carga los
   seeds y corre `npm run db:verify`.

## Fuente de datos: PostgreSQL (Prisma)

El sitio lee los datos dinámicamente de PostgreSQL mediante Prisma 8. Las pruebas usan sus
propios fixtures (`__tests__/game-fixtures.ts`), así que cambiar los datos de la base no rompe
ninguna prueba.

## Juegos (`src/features/games`)

```
lib/types.ts                          Tipo de dominio `Game` (lo único que conoce el resto de la app)
lib/game-repository.ts                Contrato `GameRepository` (listGames, findGameBySlug)
lib/game-mapping.ts                   toGame(fila): arma `Game` desde las tablas (pura, con pruebas)
lib/server/prisma-game-repository.ts  GameRepository sobre PostgreSQL (Prisma)
lib/server/game-repositories.ts       getGameRepository(): devuelve prismaGameRepository
lib/server/games-queries.ts           Consultas cacheadas ("use cache" + cacheTag("games"))
lib/server/games-prefetch.ts          Estado de TanStack Query prellenado en el servidor
lib/games-query-options.ts            queryOptions y query keys de TanStack Query
api/games-route.ts                    GET /api/games (src/app/api/games/route.ts sólo lo re-exporta)
api/games-contract.ts                 GameDto: lo que viaja por HTTP y su validación en el navegador
api/games-api-client.ts               fetchGames(): fetch a /api/games + parseGamesResponse()
__tests__/game-fixtures.ts            Juegos de prueba independientes de la base de datos
public/games/*.jpg                    Portadas de los juegos
```

Flujo de datos:

```
Prisma  ->  GameRepository  ->  getGameRepository()  ->  games-queries.ts ("use cache")
                                          |-> pages (Server Components) -> QueryHydrationBoundary
                                          |-> api/games-route.ts (GameDto) -> fetchGames() en el navegador
                                                                   TanStack Query -> useGames()
```

- **Qué se muestra**: sólo los juegos con portada (`game_image.is_cover`). Un juego sin stand se
  muestra con "Por asignar" y no aparece en el croquis. La tabla "Relación con el tipo `Game`" de
  [`data-model.md`](./data-model.md) dice de qué columna sale cada campo.
- **Fotos por URL**: además de las rutas del sitio (`/...`), se aceptan URLs `https` de los
  dominios de `IMAGE_REMOTE_HOSTS` (`.env`); `next/image` sólo optimiza esos dominios.
- Si agregas o cambias un campo de `Game` que el navegador necesita, actualiza también `GameDto`,
  `toGameDto` y `parseGamesResponse` en `api/games-contract.ts`: TypeScript marca el error en
  `toGameDto` y la prueba `games-contract.test.ts` comprueba que el viaje por HTTP no pierde datos.
- Cuando la base de datos tenga los juegos de los equipos, se puede borrar la carpeta `lib/mock/`
  (con su prueba), quitar `mock` de `game-repositories.ts` y borrar las portadas de `public/mock/`.

## Acciones de administración (CRUD)

Las funciones de `lib/server/*-queries.ts` hacen el trabajo y las Server Actions de
`lib/*-actions.ts` son lo que llama el panel de administración (ver abajo).

```
games/lib/server/games-admin-queries.ts     CRUD de juegos (incluye los que no tienen portada)
games/lib/server/game-images-queries.ts     CRUD de fotos (una sola portada por juego)
games/lib/server/catalog-options-queries.ts CRUD de géneros y plataformas
games/lib/catalog-validation.ts             Validación de juegos, fotos, géneros y plataformas
games/lib/games-actions.ts                  Server Actions del panel para el catálogo
teams/lib/server/teams-queries.ts           CRUD de equipos, integrantes y llaves de escáner
teams/lib/team-validation.ts                Validación de equipos e integrantes
teams/lib/teams-actions.ts                  Server Actions del panel para equipos
```

Cada acción usa `runAdminAction()` (`@shared/lib/server/admin-action`), que:

1. Comprueba que la petición venga de un administrador (`isAdminRequest`, HTTP Basic con
   `ADMIN_USER` y `ADMIN_PASSWORD`). Sin esas variables, todas las acciones se rechazan.
2. Valida los datos (`*-validation.ts`) y responde con errores por campo en español.
3. Traduce las restricciones de la base (duplicados, `CHECK`, llaves foráneas) a mensajes
   (`@shared/lib/server/db-errors`).
4. Invalida la caché del sitio con `updateTag(GAMES_CACHE_TAG)` y vuelve a renderizar la página
   que la llamó (`refresh()`), así las listas del panel se actualizan solas.

Todas devuelven un `ActionResult` (`@shared/lib/action-result`):

```ts
const result = await createTeamAction({ name: "Equipo Grava", standCode: "A1" });
if (result.ok) {
  // result.data.scannerKey: llave del escáner; sólo se muestra esta vez.
} else {
  // result.error y result.fieldErrors?.name
}
```

### Panel de administración (`src/features/admin`)

`/admin` es la interfaz de esas acciones. Para abrirlo en local, define `ADMIN_USER` y
`ADMIN_PASSWORD` en `.env` (con `DATA_SOURCE=prisma`) y entra con esas credenciales; el navegador
las recuerda y las manda en cada acción.

| Sección | Qué hace |
| --- | --- |
| `/admin` | Resumen: equipos (con stand), juegos (visibles) y ganadores. |
| `/admin/teams` | Alta y edición de equipos, stand, integrantes y llave del escáner (se muestra una sola vez). |
| `/admin/games` | Alta y edición de juegos, géneros extra, plataformas y fotos; "Hacer portada" lo publica. |
| `/admin/catalog` | Géneros y plataformas. |
| `/admin/raffle` | Sortear ganadores, marcarlos como avisados y generar un QR nuevo a un visitante. |

- **Protección**: `src/proxy.ts` responde `401` sin las credenciales; las páginas
  (`lib/server/admin-queries.ts`) y las acciones (`runAdminAction`) las vuelven a comprobar, por si
  una ruta queda fuera del `matcher`. El service worker no guarda `/admin` y `robots.txt` lo excluye.
- **Formularios**: `AdminActionForm` manda los campos a la acción y muestra los errores por campo;
  `AdminActionButton` ejecuta borrados y acciones de un clic (con confirmación). Los textos están
  en `lib/admin-copy.ts`.

## Visitantes, check-ins y sorteo (`src/features/visitors`)

Las reglas y las sentencias están explicadas en [`data-model.md`](./data-model.md) ("Participación
de visitantes"). Esta feature siempre usa PostgreSQL: no tiene versión mock.

```
lib/visitor-rules.ts              Reglas puras: gamertag, teléfono, token del QR, lote del escáner, ajuste de hora
lib/visitors-links.ts             Rutas: /passport y /v/<token>
lib/visitors-copy.ts              Textos del pasaporte, el sorteo y la afluencia
lib/server/visitor-session.ts     Cookie httpOnly con el token del QR
lib/server/visitors-queries.ts    Registro, pasaporte (QR + avance + boleto) y reemisión del QR
lib/server/check-ins-queries.ts   Llave del escáner -> juego; guarda lotes de escaneos (idempotente)
lib/server/raffle-queries.ts      Boleto, sorteo con crypto.randomInt y aviso a ganadores
lib/server/traffic-queries.ts     Afluencia por stand ("use cache" de 30 s)
lib/visitors-actions.ts           Server Actions: registro y boleto (públicas); sorteo y QR nuevo (admin)
api/check-ins-route.ts            GET y POST /api/check-ins (escáner del stand)
api/stand-traffic-route.ts        GET /api/stand-traffic
api/visitor-qr-route.ts           GET /v/<token>
api/visitors-api-client.ts        fetchStandTraffic(): fetch + validación de la respuesta
```

- **Pasaporte (`/passport`)**: sin cookie muestra el registro (sólo gamertag); con cookie, el QR,
  el avance, la lista de juegos con stand y el sorteo. Los juegos que cuentan para el boleto son
  los de equipos con stand asignado.
- **QR**: codifica `NEXT_PUBLIC_SITE_URL/v/<token>`. Abrirlo (por ejemplo, desde la captura de
  pantalla) guarda la cookie y lleva al pasaporte; un QR reemplazado lleva a
  `/passport?qr=unknown`. La cookie es `Secure` cuando el sitio se sirve por https. El QR se dibuja
  en el servidor como SVG (`@shared/components/qr-code`, con `qrcode-generator`).
- **Afluencia**: `/api/stand-traffic` devuelve los check-ins de los últimos 15 minutos por stand;
  el croquis la muestra en cada stand de equipo y la refresca cada 30 segundos. Los umbrales
  ("Sin fila", "Afluencia media", "Mucha afluencia") están en `lib/stand-traffic.ts`.
- **Sin conexión**: cuando `/passport` se abre con una carga completa y hay red, el service worker
  guarda esa página (con el QR) como cualquier otra; no la guarda al llegar por la redirección de
  `/v/<token>` ni por navegación interna. Por eso el respaldo principal sigue siendo la captura
  de pantalla del QR. `/passport` no se precarga porque es personal.

### Endpoint del escáner

El escáner de cada stand (la PWA está pendiente) manda la llave de su equipo en el encabezado
`x-scanner-key` (la generan `createTeamAction` o `rotateTeamScannerKeyAction`):

```http
GET /api/check-ins                    -> 200 { "game": { "name", "standCode" } } o 401
POST /api/check-ins
Content-Type: application/json

{ "checkIns": [{ "id": "<uuid del escáner>", "token": "<URL o token del QR>", "scannedAt": "<ISO 8601>" }] }

-> 200 { "game": {...}, "results": [{ "id", "status": "created" | "duplicate" | "unknown" }] }
-> 400 si el lote está vacío, pasa de 200 escaneos o un id/fecha no es válido
```

- Reenviar el mismo lote es seguro: lo ya guardado responde `duplicate`.
- `unknown` es un QR mal leído o reemplazado; no aborta el lote.
- `scannedAt` se ajusta entre el inicio del evento (`EVENT_INFO.startsAt`) y la hora en que
  llega al servidor.

Para probarlo en local, asigna una llave conocida a un equipo:

```bash
KEY=$(openssl rand -hex 16); HASH=$(printf %s "$KEY" | sha256sum | cut -d' ' -f1)
docker compose exec db psql -U utg -d ut_game_showcase \
  -c "UPDATE team SET scanner_key_hash = '$HASH' WHERE stand_code = 'A1'"
curl -H "x-scanner-key: $KEY" http://localhost:3000/api/check-ins
```

## Croquis (`src/features/floor-plan`)

El croquis no tiene datos propios en la base: combina contenido fijo del recinto con los
ocupantes de los stands de equipo. No conoce los juegos: su page los convierte con
`toStandOccupants` (`games/lib/game-stand.ts`); los juegos sin stand no se dibujan.

```
lib/types.ts                `StandOccupant`: lo que el croquis necesita de quien ocupa un stand
lib/plan-places.ts          Zonas (escenario, arena, servicios...) y stands informativos C1-C4
lib/plan-layouts.ts         Geometría del SVG en horizontal (wide) y vertical (tall)
lib/plan-items.ts           Une zonas, stands informativos y ocupantes (`buildPlanItems(occupants)`)
__tests__/plan-fixtures.ts  Ocupantes de prueba (las pruebas del croquis no dependen de `games`)
```

- Para **asignar un stand** a un juego cambia el stand de su equipo (`team.stand_code`, con
  `updateTeamAction`). El código debe existir en `plan-layouts.ts` (pasillos A1-A9 y B1-B9; C1-C4
  son los stands informativos).
- Para **agregar un stand**, aumenta `rows` o `columns` del bloque en ambas orientaciones.
- Los componentes del croquis reciben `items` (`buildPlanItems`) y `layouts` (`PLAN_LAYOUTS`) por
  props desde la page; no importan las zonas ni la geometría.
- Si algún día las zonas vienen de la base de datos, crea un repositorio como el de juegos y
  conserva `buildPlanItems` como punto de unión.

## Contenido del evento (`src/features/event`)

Es contenido fijo del sitio, no datos de la base:

```
lib/event-info.ts      Fecha, horario, sede, dirección, Google Calendar y Google Maps
lib/event-program.ts   Textos de la portada, torneos y sorteos, y el programa del día
lib/event-media.ts     Reel del encabezado (public/media/reel.webm, .mp4 y póster .jpg)
lib/event-content.ts   getEventContent(): único punto de lectura de todo lo anterior
```

Los componentes de `event` no importan esas constantes: la portada (`home/pages/home-page.tsx`)
llama una vez a `getEventContent()` y pasa a cada sección sólo lo que usa. Si el contenido pasa
a la base de datos, `getEventContent()` se convierte en una consulta cacheada en
`lib/server/event-queries.ts` y ningún componente cambia.

- El programa enlaza cada actividad con una zona del croquis (`zoneId`), que debe existir en
  `floor-plan/lib/plan-places.ts` (`stage`, `arena`, `raffles`, `food`, `info`, `wc`, `rest`
  o `entry`). Los ids van en inglés aunque el nombre visible esté en español. La portada valida
  el enlace con `resolveScheduleZones` (`home/lib/schedule-zones.ts`): un `zoneId` mal escrito
  hace fallar `npm test` y el build, no el sitio publicado.
- La descripción de la portada usa el número real de juegos del catálogo.
- El reel de `public/media/` es el del diseño: reemplázalo por el video oficial del evento
  conservando los nombres de archivo.
