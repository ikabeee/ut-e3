# Despliegue con Docker (RNF-08, RNF-15, RNF-16, RNF-17)

Estado: implementado en `feature/docker` (desde `develop`), pendiente de revisión.

## Alcance

- `next.config.ts`: `output: "standalone"`. `next dev`, `next start` y los e2e (que usan `next dev`) siguen igual.
- `Dockerfile` (Node 22 bookworm-slim, el mismo major que el CI y `.nvmrc`), tres etapas:
  1. `build`: `npm ci` (con `prisma generate` en el postinstall), migra y siembra una SQLite temporal y corre
     `next build`. Es necesario porque las consultas con `"use cache"` leen la base durante el build, igual que en el CI.
  2. `runtime-deps`: `npm ci --omit=dev` más `prisma`, `tsx` y `@next/env` con las versiones del `package.json`, porque
     el contenedor migra y siembra al arrancar. `better-sqlite3` se reconstruye para la arquitectura de la imagen.
  3. `runner`: el build standalone, `public/`, `.next/static`, el cliente de Prisma generado, `prisma/` y `src/` (el seed
     importa código de `src/`). Usuario `node` (uid 1000), volumen `/data`, `HEALTHCHECK` contra `/api/health`.
- `docker/entrypoint.sh`: valida `NEXT_PUBLIC_SITE_URL` y `PIN_ENCRYPTION_KEY`, corre `prisma migrate deploy` y
  `prisma db seed` y deja `node server.js` como proceso principal (recibe SIGTERM; la parada tarda ~1 s).
- `docker-compose.yml`: servicio `app`, volumen `app-data`, `env_file: .env`, `init: true`, `restart: unless-stopped`,
  `stop_grace_period: 30s`, puerto `127.0.0.1:${APP_PORT:-3000}:3000`. Sin Caddy.
- `.dockerignore`, `.env.production.example` (con excepción en `.gitignore`), `.gitattributes` (`*.sh` con LF),
  `GET /api/health` (feature `site`, con prueba) y `docs/deploy.md`.

## Decisiones sobre la SRS y el encargo

- **RNF-15 pide Caddy con TLS automático y la imagen construida en GitHub Actions.** El encargo pide lo contrario (el
  VPS ya tiene su proxy; documentar cómo construir). Se siguió el encargo: Compose sin Caddy, build en el VPS con
  `docker compose build`, y ejemplos de Nginx y Caddy en `docs/deploy.md` para el proxy existente. Ni el workflow que
  publica la imagen ni el servicio Caddy opcional se hicieron; la SRS no se modificó.
- **El seed completo corre en cada arranque.** El encargo pide el seed del repo para crear al sysadmin, pero
  `prisma db seed` también llena horarios, cronograma, juegos de muestra y patrocinadores cuando esas tablas están
  vacías. En producción eso carga los 18 stands de muestra, que el sysadmin edita desde `/admin`. Hay una sola entrada de
  seed en el repo; separar solo al sysadmin pedía código nuevo. El seed no toca tablas con datos.
- **Contenido del build.** El HTML prerenderizado durante el build sale de la SQLite temporal con los datos de muestra;
  los cambios del sysadmin invalidan sus caches con `updateTag`, así que no se espera contenido viejo de ese origen.
- **`/api/health` no toca la base.** Es liveness: dice que el servidor responde. Un fallo de base se vería en las
  páginas, no en el healthcheck.
- **Imagen grande.** ~400 MB comprimida y ~1.2 GB de `node_modules`, porque el contenedor lleva dependencias de
  producción completas más Prisma CLI y tsx para migrar y sembrar. Reducirla pide un contenedor aparte de migraciones o
  compilar el seed; queda fuera.
- **`VACUUM INTO` horario:** solo documentado, sin cron. La restauración necesita `chown` después de `docker compose cp`
  (queda como root y la base se vería de solo lectura).
- **`db:seed:stands`:** se niega con `NODE_ENV=production`. En una instancia de pruebas se fuerza con
  `-e NODE_ENV=development`.

## Verificación

Con Docker Desktop (linux/amd64): `docker compose build` correcto; contenedor `healthy`; `/` y `/games` responden 200;
`/admin` sin sesión redirige a `/login`; el login del sysadmin del `.env` funciona en un navegador real; la sesión
sobrevive a `restart` y a `down` + `up` (el volumen conserva la base); la base queda en modo WAL; `VACUUM INTO` y la
restauración funcionan; `docker compose stop` tarda ~1 s. No se probó: arquitectura arm64, el build desde GitHub Actions,
Nginx/Caddy reales con TLS y SSE a través de un proxy, ni el reinicio automático tras reiniciar el VPS.
