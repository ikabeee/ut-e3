# Torneo de KOF

Captura y seguimiento del torneo de *The King of Fighters* en `/admin/kof` (SRS v2, módulo M10, RF-57 a RF-66).

## Formato

- Eliminación directa para 64 jugadores: 63 combates. Cuatro tableros de 16 jugadores y 15 combates cada uno
  (rondas de 8, 4, 2 y 1), dos semifinales y la final.
- El bracket se genera una sola vez, a la hora configurada en `event_settings.kofBracketGeneratesAt` (12:55 del día del
  evento), con los jugadores que hicieron check-in. El barajeo usa Fisher-Yates con `crypto.randomInt` y su resultado
  queda en la bitácora (RF-59).
- Con menos de 64 jugadores los lugares vacíos son byes, repartidos parejo entre los tableros, y un bye nunca se
  enfrenta a otro (RF-60). Por eso el bracket pide entre 32 y 64 jugadores.

## Quién captura qué

El equipo opera con dos staffs para los cuatro tableros (RF-62, SRS 2.4):

| Cuenta | Captura |
| --- | --- |
| Staff de la mesa 1 (`kof_staff`, `kofDesk = 1`) | Tableros 1 y 2, semifinal 1 y final |
| Staff de la mesa 2 (`kof_staff`, `kofDesk = 2`) | Tableros 3 y 4 y semifinal 2 |
| Administrador de KOF (`kof_admin`) | Cualquier combate, y además congelar, descongelar, descalificar y revertir |

El staff inicia el combate, marca al perdedor y marca "No se presentó". El sysadmin no tiene comandos del torneo.
Cada Server Action valida la sesión, el rol y la mesa del combate; la interfaz solo esconde botones.

## Estados del combate

`pending` -> `ready` -> `active` -> `finished`, y `frozen` solo lo pone el administrador (RF-66). Un combate con un bye
se resuelve solo. "No se presentó" y la descalificación tienen el mismo efecto; si se quita a los dos jugadores, el
siguiente combate es bye para su rival. Una doble descalificación en una semifinal deja campeón al otro finalista, y en
la final deja el torneo sin campeón (RF-65). El administrador revierte un resultado de "No se presentó" o de
descalificación mientras el siguiente combate no haya empezado; un combate jugado no se revierte.

## Cómo está construido

```
lib/types.ts                  Tipos de dominio y TournamentCommand (comandos serializables)
lib/bracket-layout.ts         Los 63 combates y de dónde sale cada lado
lib/bracket-generation.ts     Barajeo, byes y generación del bracket
lib/match-resolution.ts       Ganador, byes automáticos y fin del torneo
lib/result-revert.ts          Quitar al ganador del siguiente combate al revertir
lib/tournament-engine.ts      applyCommand(): función pura que valida y aplica cada comando
lib/tournament-rules.ts       Constantes, mesa de cada combate y permisos (canRunCommand)
lib/tournament-view.ts        Selectores para la pantalla (secciones, jugadores, contadores)
lib/tournament-command-parser.ts  Lee el formulario de la Server Action
lib/tournament-actions.ts     Server Action submitTournamentCommand
lib/server/                   Consultas, mutaciones con versión y bitácora, y el seed de desarrollo
api/                          GET /api/tournament (solo cuentas de KOF) y su cliente
hooks/use-tournament.ts       Polling cada 3 segundos
components/                   Panel, secciones, tarjetas de combate y botones con confirmación
pages/kof-page.tsx            Contenedor de /admin/kof
```

El estado completo del torneo vive en una fila de `kof_tournament` (JSON y un número de versión). Cada comando se guarda
solo si la versión sigue siendo la que se leyó; si la otra mesa guardó antes, el comando se vuelve a aplicar sobre el
estado nuevo y solo falla con "El combate cambió, recarga." cuando ya no encaja. Cada cambio deja una fila en la
bitácora de auditoría dentro de la misma transacción.

## Probarlo en local

```bash
npm run db:deploy       # aplica las migraciones, incluidas kof_desk y kof_tournament
npm run db:seed         # contenido inicial y cuenta del sysadmin
npm run db:seed:kof     # solo desarrollo: 3 cuentas de KOF, 40 jugadores de prueba y el bracket
npm run dev             # http://localhost:3000/login
```

`npm run db:seed:kof` crea `kof-admin@ejemplo.com`, `kof-mesa1@ejemplo.com` y `kof-mesa2@ejemplo.com`. La contraseña de
ejemplo está en `src/features/tournament/lib/server/tournament-dev-seed.ts` y se cambia con `KOF_DEV_PASSWORD`. El script
adelanta `kofBracketGeneratesAt` a la hora actual solo en tu base local, se niega a correr con `NODE_ENV=production` y
puede repetirse: solo agrega lo que falta.

## Pendiente

- La lista de inscritos y el check-in por PIN (RF-58, RF-75 a RF-77) dependen de M4. Mientras tanto
  `generateTournament` recibe los jugadores como parámetro y solo el seed de desarrollo lo llama.
- El bracket público, el cierre al público y el tiempo real por SSE (RF-67, RF-74).
- El alta de las cuentas de staff por el administrador de KOF y la asignación de su mesa.
