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

- **Todo en Docker**: `npm run docker:up` levanta la base, corre migraciones y seeds (servicio
  `migrate`, que se reconstruye cada vez para tomar las migraciones nuevas) y construye y sirve el
  sitio en `http://localhost:3000`. `npm run docker:down` lo
  detiene. `DATA_SOURCE` (de `.env`) se usa en el build y al servir; con `prisma`, el build
  necesita la base con datos porque prerenderiza el catálogo, por eso el script levanta `db` y
  `migrate` antes de construir `app`.
- **Seeds** (`src/shared/lib/prisma/seed.ts` y `seed-data.json`): se pueden correr varias
  veces, no duplican ni modifican lo que ya existe. Son los mismos 18 juegos del mock; las
  portadas están en `public/mock/games/` (las que dicen "PORTADA DE EJEMPLO" son de relleno).
- **Llaves de escáner**: el seed genera una llave aleatoria por equipo nuevo y la imprime una
  sola vez; la base sólo guarda su hash. Si las pierdes en tu base local, bórrala y vuelve a
  sembrar.
- **Empezar de cero**: `docker compose down -v` borra el volumen con los datos.
- **Puertos ocupados**: cambia `POSTGRES_PORT` o `APP_PORT` en `.env` (y el puerto de
  `DATABASE_URL`).

### Cambiar el modelo

1. Edita `contract.prisma` y ejecuta `npm run db:emit` (lee antes
   `node_modules/@prisma/orm-postgres/skills/prisma-8/`).
2. En tu base local puedes probar con `npm run db:update` (no escribe migraciones).
3. Antes del PR genera la migración formal con `npm run db:migration:plan -- --name <cambio>`,
   revisa `migrations/app/<fecha>_<cambio>/` y súbela junto con el contrato.
4. `npm run db:migrate` la aplica. El CI levanta PostgreSQL, aplica las migraciones, carga los
   seeds y corre `npm run db:verify`.

## Datos mock

Mientras el sitio no lea la base de datos, usa **datos mock** con el contenido del diseño
(carpeta UTG). Están aislados detrás de interfaces para que conectar Prisma no toque
componentes, hooks ni pages, y la fuente se elige con la variable `DATA_SOURCE` (`mock` por
defecto, `prisma` cuando exista su repositorio), validada en `src/shared/lib/env.ts`.

Los mocks son contenido del sitio, no datos de prueba: las pruebas usan sus propios fixtures
(`__tests__/game-fixtures.ts`), así que agregar un juego al mock no rompe ninguna.

## Juegos (`src/features/games`)

```
lib/types.ts                       Tipo de dominio `Game` (lo único que conoce el resto de la app)
lib/game-repository.ts             Contrato `GameRepository` (listGames, findGameBySlug)
__tests__/game-fixtures.ts         Juegos de prueba (las pruebas no dependen del mock)
lib/mock/mock-games.ts             MOCK temporal: los 18 juegos del diseño
lib/mock/mock-game-repository.ts   MOCK temporal: implementación en memoria de GameRepository
lib/server/game-repositories.ts    getGameRepository(): elige el repositorio según DATA_SOURCE
lib/server/games-queries.ts        Consultas cacheadas ("use cache" + cacheTag("games"))
lib/server/games-prefetch.ts Estado de TanStack Query prellenado en el servidor
lib/games-query-options.ts   queryOptions y query keys de TanStack Query
api/games-route.ts           GET /api/games (src/app/api/games/route.ts sólo lo re-exporta)
api/games-contract.ts        GameDto: lo que viaja por HTTP y su validación en el navegador
api/games-api-client.ts      fetchGames(): fetch a /api/games + parseGamesResponse()
public/mock/games/*.jpg      MOCK: imágenes de referencia del diseño
```

Flujo de datos:

```
Prisma / mock  ->  GameRepository  ->  getGameRepository() (DATA_SOURCE)  ->  games-queries.ts ("use cache")
                                          |-> pages (Server Components) -> QueryHydrationBoundary
                                          |-> api/games-route.ts (GameDto) -> fetchGames() en el navegador
                                                                   TanStack Query -> useGames()
```

Si agregas o cambias un campo de `Game` que el navegador necesita, actualiza también `GameDto`,
`toGameDto` y `parseGamesResponse` en `api/games-contract.ts`: TypeScript marca el error en
`toGameDto` y la prueba `games-contract.test.ts` comprueba que el viaje por HTTP no pierde datos.

### Pasos para usar Prisma

> El contrato (`src/shared/lib/prisma/contract.prisma`) ya implementa el modelo relacional de
> [`data-model.md`](./data-model.md) (equipos, géneros, plataformas, fotos, check-ins y rifa); la
> tabla "Relación con el tipo `Game` actual" de ese documento explica cómo armar `Game` con él.

1. Levanta la base local, aplica las migraciones y carga los seeds (ver "Base de datos local").
2. Crea `src/features/games/lib/server/prisma-game-repository.ts` que implemente `GameRepository`
   y mapee las filas al tipo `Game` (el resto de la app no conoce los tipos de Prisma):

   ```ts
   import "server-only";
   import type { GameRepository } from "@features/games/lib/game-repository";
   import { db } from "@shared/lib/prisma/db";

   // toGame(row) arma el tipo Game con el equipo, el género, las plataformas y las fotos
   // (tabla "Relación con el tipo `Game` actual" de docs/data-model.md).

   export const prismaGameRepository: GameRepository = {
     async listGames() {
       const rows = await db.orm.public.Game.orderBy((game) => game.sortOrder.asc()).all();
       return rows.map(toGame);
     },
     async findGameBySlug(slug) {
       const row = await db.orm.public.Game.where({ slug }).first();
       return row ? toGame(row) : null;
     },
   };
   ```

3. Registra el repositorio en `lib/server/game-repositories.ts` (`prisma: prismaGameRepository`)
   y define `DATA_SOURCE=prisma` en el entorno donde haya base de datos. Sin tocar código puedes
   seguir usando los mocks en otro entorno (por ejemplo, el CI compila con `DATA_SOURCE=mock`).
   Las consultas ya tienen `"use cache"`, así que las pages se siguen prerenderizando.
4. Cuando una Server Action modifique juegos, llama `updateTag(GAMES_CACHE_TAG)` y, en el
   cliente, `queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all })`.
5. Cuando la base de datos tenga los juegos, borra la carpeta `lib/mock/` (con su prueba,
   `__tests__/lib/mock/mock-game-repository.test.ts`), quita `mock` de `game-repositories.ts` y
   borra `public/mock/`. Las pruebas de la lógica y el helper `renderWithGames` usan los juegos de
   prueba de `__tests__/game-fixtures.ts`, así que siguen funcionando sin el mock.

> Las imágenes de `public/mock/games/` son las de referencia del diseño, no arte de los equipos.
> Reemplázalas antes de publicar el sitio.

## Croquis (`src/features/floor-plan`)

El croquis no tiene datos propios en la base: combina contenido fijo del recinto con los
ocupantes de los stands de equipo. No conoce los juegos: su page los convierte con
`toStandOccupant` (`games/lib/game-stand.ts`).

```
lib/types.ts                `StandOccupant`: lo que el croquis necesita de quien ocupa un stand
lib/plan-places.ts          Zonas (escenario, arena, servicios...) y stands informativos C1-C4
lib/plan-layouts.ts         Geometría del SVG en horizontal (wide) y vertical (tall)
lib/plan-items.ts           Une zonas, stands informativos y ocupantes (`buildPlanItems(occupants)`)
__tests__/plan-fixtures.ts  Ocupantes de prueba (las pruebas del croquis no dependen de `games`)
```

- Para **asignar un stand** a un juego sólo cambia el campo `stand` del juego. El código debe
  existir en `plan-layouts.ts` (pasillos A1-A9, B1-B9 y central C1-C4).
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
