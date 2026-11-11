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
lib/games-queries.ts         Consultas cacheadas ("use cache" + cacheTag("games")); elige el repositorio
lib/games-prefetch.ts        Estado de TanStack Query prellenado en el servidor
lib/games-query-options.ts   queryOptions + fetch a /api/games para el navegador
public/mock/games/*.jpg      MOCK: imágenes de referencia del diseño
```

Flujo de datos:

```
Prisma / mock  ->  GameRepository  ->  games-queries.ts ("use cache")
                                          |-> pages (Server Components) -> QueryHydrationBoundary
                                          |-> /api/games (Route Handler) -> fetchGames() en el navegador
                                                                   TanStack Query -> useGames()
```

### Pasos para usar Prisma

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
     stand         String  @unique
     hasTournament Boolean
     description   String
     imageSrc      String?
     imagePosition String?
     artSeed       Int
     artShape      String
     artBackground String
     position      Int
   }
   ```

2. Crea `src/features/games/lib/prisma-game-repository.ts` que implemente `GameRepository`
   y mapee las filas al tipo `Game` (el resto de la app no conoce los tipos de Prisma):

   ```ts
   import "server-only";
   import type { GameRepository } from "@features/games/lib/game-repository";
   import { db } from "@shared/lib/prisma/db";

   // toGame(row) arma el tipo Game: `image` con imageSrc/imagePosition y `art` con artSeed/palette.

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

3. En `lib/games-queries.ts` cambia `mockGameRepository` por `prismaGameRepository`.
   Las consultas ya tienen `"use cache"`, así que las pages se siguen prerenderizando.
4. Cuando una Server Action modifique juegos, llama `updateTag(GAMES_CACHE_TAG)` y, en el
   cliente, `queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all })`.
5. Borra `lib/mock-games.ts`, `lib/mock-game-repository.ts` (y su prueba) y `public/mock/`.
   Las pruebas de `game-filters` y `game-genres` usan `MOCK_GAMES`: muévelas a un fixture
   (`lib/game-fixtures.ts`) antes de borrar el mock.

> Las imágenes de `public/mock/games/` son las de referencia del diseño, no arte de los equipos.
> Reemplázalas antes de publicar el sitio.

## Croquis (`src/features/floor-plan`)

El croquis no tiene datos propios en la base: combina contenido fijo del recinto con los juegos.

```
lib/plan-places.ts    Zonas (escenario, arena, servicios...) y stands informativos C1-C4
lib/plan-layouts.ts   Geometría del SVG en horizontal (wide) y vertical (tall)
lib/plan-items.ts     Une zonas, stands informativos y juegos (cada juego ocupa su `stand`)
```

- Para **asignar un stand** a un juego sólo cambia el campo `stand` del juego. El código debe
  existir en `plan-layouts.ts` (pasillos A1-A9, B1-B9 y central C1-C4).
- Para **agregar un stand**, aumenta `rows` o `columns` del bloque en ambas orientaciones.
- Si algún día las zonas vienen de la base de datos, crea un repositorio como el de juegos y
  conserva `buildPlanItems` como punto de unión.

## Contenido del evento (`src/features/event`)

Es contenido fijo del sitio, no datos de la base:

```
lib/event-info.ts      Fecha, horario, sede, dirección, Google Calendar y Google Maps
lib/event-program.ts   Textos de la portada, torneos y sorteos, y el programa del día
lib/event-media.ts     Reel del encabezado (public/media/reel.webm, .mp4 y póster .jpg)
```

- El programa enlaza cada actividad con una zona del croquis (`zoneId`), que debe existir en
  `floor-plan/lib/plan-places.ts`.
- La descripción de la portada usa el número real de juegos del catálogo.
- El reel de `public/media/` es el del diseño: reemplázalo por el video oficial del evento
  conservando los nombres de archivo.
