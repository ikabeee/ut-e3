# Fuentes de datos y cómo reemplazar los mocks

Mientras no exista la base de datos, el sitio usa **datos mock** con el contenido del diseño
(carpeta UTG). Están aislados detrás de interfaces para que conectar Prisma no toque
componentes, hooks ni pages.

## Juegos (`src/features/games`)

```
lib/types.ts                 Tipo de dominio `Game` (lo único que conoce el resto de la app)
lib/game-repository.ts       Contrato `GameRepository` (listGames, findGameBySlug)
lib/mock-games.ts            MOCK: los 18 juegos del diseño
lib/mock-game-repository.ts  MOCK: implementación en memoria de GameRepository
lib/server/games-queries.ts  Consultas cacheadas ("use cache" + cacheTag("games")); elige el repositorio
lib/server/games-prefetch.ts Estado de TanStack Query prellenado en el servidor
lib/games-query-options.ts   queryOptions y query keys de TanStack Query
api/games-route.ts           GET /api/games (src/app/api/games/route.ts sólo lo re-exporta)
api/games-contract.ts        GameDto: lo que viaja por HTTP y su validación en el navegador
api/games-api-client.ts      fetchGames(): fetch a /api/games + parseGamesResponse()
public/mock/games/*.jpg      MOCK: imágenes de referencia del diseño
```

Flujo de datos:

```
Prisma / mock  ->  GameRepository  ->  games-queries.ts ("use cache")
                                          |-> pages (Server Components) -> QueryHydrationBoundary
                                          |-> api/games-route.ts (GameDto) -> fetchGames() en el navegador
                                                                   TanStack Query -> useGames()
```

Si agregas o cambias un campo de `Game` que el navegador necesita, actualiza también `GameDto`,
`toGameDto` y `parseGamesResponse` en `api/games-contract.ts`: TypeScript marca el error en
`toGameDto` y la prueba `games-contract.test.ts` comprueba que el viaje por HTTP no pierde datos.

### Pasos para usar Prisma

> El modelo relacional propuesto (equipos, stands, géneros, check-ins y rifa) está en
> [`data-model.md`](./data-model.md). El ejemplo de abajo es la versión plana mínima que
> reproduce el tipo `Game` actual; la tabla "Relación con el tipo `Game` actual" de ese
> documento explica cómo armarlo desde el modelo relacional.

1. Agrega el modelo al contrato `src/shared/lib/prisma/contract.prisma` y ejecuta
   `npm run db:emit` (lee antes `node_modules/@prisma/orm-postgres/skills/prisma-8/`):

   ```prisma
   model Game {
     id            Int     @id @default(autoincrement())
     slug          String  @unique
     name          String
     genre         String
     team          String
     members       Int
     players       Int     @default(1)
     stand         String  @unique
     hasTournament Boolean
     description   String
     about         String?
     imageSrc      String?
     imagePosition String?
     artSeed       Int
     artShape      String
     artBackground String
     position      Int
   }
   ```

2. Crea `src/features/games/lib/server/prisma-game-repository.ts` que implemente `GameRepository`
   y mapee las filas al tipo `Game` (el resto de la app no conoce los tipos de Prisma):

   ```ts
   import "server-only";
   import type { GameRepository } from "@features/games/lib/game-repository";
   import { db } from "@shared/lib/prisma/db";

   // toGame(row) arma el tipo Game: `image` con imageSrc/imagePosition, `art` con artSeed/palette
   // y `about` partiendo el texto en párrafos (`null` si no tiene).

   export const prismaGameRepository: GameRepository = {
     async listGames() {
       const rows = await db.orm.public.Game.orderBy((game) => game.position.asc()).all();
       return rows.map(toGame);
     },
     async findGameBySlug(slug) {
       const row = await db.orm.public.Game.where({ slug }).first();
       return row ? toGame(row) : null;
     },
   };
   ```

3. En `lib/server/games-queries.ts` cambia `mockGameRepository` por `prismaGameRepository`.
   Las consultas ya tienen `"use cache"`, así que las pages se siguen prerenderizando.
4. Cuando una Server Action modifique juegos, llama `updateTag(GAMES_CACHE_TAG)` y, en el
   cliente, `queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all })`.
5. Borra `lib/mock-games.ts`, `lib/mock-game-repository.ts` (y su prueba) y `public/mock/`.
   Las pruebas de `game-filters` y `game-genres` usan `MOCK_GAMES`: muévelas a un fixture
   (`lib/game-fixtures.ts`) antes de borrar el mock.

> Las imágenes de `public/mock/games/` son las de referencia del diseño, no arte de los equipos.
> Reemplázalas antes de publicar el sitio.

## Croquis (`src/features/floor-plan`)

El croquis no tiene datos propios en la base: combina contenido fijo del recinto con los
ocupantes de los stands de equipo. No conoce los juegos: su page los convierte con
`toStandOccupant` (`games/lib/game-stand.ts`).

```
lib/types.ts          `StandOccupant`: lo que el croquis necesita de quien ocupa un stand
lib/plan-places.ts    Zonas (escenario, arena, servicios...) y stands informativos C1-C4
lib/plan-layouts.ts   Geometría del SVG en horizontal (wide) y vertical (tall)
lib/plan-items.ts     Une zonas, stands informativos y ocupantes (`buildPlanItems(occupants)`)
lib/plan-fixtures.ts  Ocupantes de prueba (las pruebas del croquis no dependen de `games`)
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
