# Despliegue con Docker

Guía para publicar la app en un VPS que ya tiene otras aplicaciones y su propio proxy inverso. Este repositorio trae
el `Dockerfile` y el `docker-compose.yml`; el proxy (Nginx o Caddy) lo pones tú y apunta a `127.0.0.1:APP_PORT`.

## Qué hay

| Archivo | Para qué |
| --- | --- |
| `Dockerfile` | Imagen en tres etapas con Node 22: compila (`prisma generate` y `next build`), arma las dependencias de arranque y deja una imagen final sin compiladores. Corre como el usuario `node` (no root). |
| `docker/entrypoint.sh` | Al arrancar aplica las migraciones pendientes (`prisma migrate deploy`), y deja `node server.js` como proceso principal. |
| `docker-compose.yml` | Un servicio `app`, volumen `app-data` con la base SQLite, reinicio automático y `stop_grace_period: 30s`. Publica solo en `127.0.0.1`. |
| `.env.production.example` | Plantilla de variables. Se copia a `.env` en el VPS. |
| `GET /api/health` | Ruta ligera que usa el `HEALTHCHECK` de la imagen. No consulta la base: responde 503 (`low-disk`) si al volumen de la base le quedan menos de 64 MB, y `docker compose ps` lo muestra como `unhealthy`. No la uses como chequeo activo del proxy (ver "Caddy"). |

La base vive en `/data/app.db` dentro del contenedor, en el volumen `app-data`. Está en modo WAL con `busy_timeout`
(RNF-08); el código lo configura al abrir cada conexión.

Las imágenes de los juegos que suben los administradores de stand (`/stand/game`) se guardan en `UPLOADS_DIR`, que en la
imagen es `/data/uploads` (el mismo volumen `app-data`; en desarrollo, `data/uploads` dentro del proyecto). Se sirven por
`GET /api/media/games/<archivo>.jpg`, con caché inmutable porque el nombre lleva un hash del contenido. Solo se aceptan
JPG reales, de máximo 5 MB, con el tamaño exacto del grid de portadas (tarjeta 810x1080; portada y hasta cuatro capturas
1920x1080). El respaldo de la base (abajo) no incluye las imágenes: copia también `/data/uploads`
(`docker compose cp app:/data/uploads ./uploads-<fecha>`). El límite de cuerpo de las Server Actions es de 6 MB
(`experimental.serverActions.bodySizeLimit` en `next.config.ts`); si pones un proxy con límite menor
(`client_max_body_size` en Nginx), súbelo a 6 MB o la carga falla antes de llegar a la app.

## Primer despliegue

Requisitos en el VPS: Docker con el plugin Compose y acceso a internet para construir (npm y GitHub).

```bash
git clone <url-del-repositorio> ut-e3 && cd ut-e3
git checkout main        # o la etiqueta de la versión que vas a publicar

cp .env.production.example .env
nano .env                # llena los valores; ver "Variables"

docker compose build
docker compose up -d
docker compose ps        # espera el estado "healthy" (el primer arranque tarda por las migraciones)
curl -s http://127.0.0.1:3000/api/health
docker compose exec app prisma db seed   # solo la primera vez: contenido inicial y cuenta del sysadmin
```

El contenedor no corre el seed al arrancar, para no tocar una base que ya tiene sus datos. Córrelo a mano solo en
una base nueva.

Después configura el proxy inverso (ver más abajo). Entra a `https://<tu-dominio>/login` con `SYSADMIN_EMAIL` y
`SYSADMIN_PASSWORD` (solo en un entorno con `SITE_MODE=full`; ver "Kill switch").

### Kill switch: solo la portada

`SITE_MODE` decide cuánto del sitio publica un despliegue:

| Valor | Qué se publica |
| --- | --- |
| `landing` (por defecto en producción) | Solo la portada `/`, el aviso `/privacy`, los archivos de `public/` y `GET /api/health`. Cualquier otra página redirige a `/`, el resto de `/api` responde 404 y todo lo que no sea `GET` o `HEAD` (formularios y Server Actions) responde 405. La portada no enlaza a nada bloqueado y no registra el service worker. |
| `full` | La app completa: pasaporte, kiosco, panel, rifa, torneo y PWA. |

El valor se lee al construir (la portada se compila con o sin esos enlaces) y al arrancar (`src/proxy.ts` bloquea), así
que la imagen guarda el modo con el que se construyó: para cambiarlo, cambia `SITE_MODE` y reconstruye. Si el contenedor
arranca con un `SITE_MODE` distinto al de su imagen, se detiene y lo dice en el log. Si falta en un servidor de
producción, el sitio arranca en `landing`; un valor distinto de `landing` o `full` detiene el build.

### Dos entornos: producción y demo

Cada entorno es un proyecto de Compose aparte (`-p`), con su archivo de variables, su puerto, su volumen (su propia base)
y su imagen (`ut-e3-app:<modo>-<etiqueta>`). Se pueden tener los dos en el mismo VPS.

```bash
# Producción: solo la portada.
cp .env.production.example .env.prod
nano .env.prod           # SITE_MODE=landing, APP_PORT=3000, ENV_FILE=.env.prod y la URL pública
docker compose -p ut-e3-prod --env-file .env.prod up -d --build

# Demo (la PWA completa para la clase): otra URL, otro puerto, otra base.
cp .env.production.example .env.demo
nano .env.demo           # SITE_MODE=full, APP_PORT=3001, ENV_FILE=.env.demo y la URL de la demo
docker compose -p ut-e3-demo --env-file .env.demo up -d --build
```

`ENV_FILE` le dice a Compose qué archivo pasa al contenedor; sin él usa `.env`. Todos los comandos de esta guía (`ps`,
`logs`, `exec`, respaldos) llevan el mismo `-p` y `--env-file` del entorno que quieres tocar. En el proxy inverso, cada
dominio apunta a su puerto. La demo arranca con las fechas reales del evento: para enseñar el registro antes del 13 de
noviembre, el sysadmin adelanta la apertura en `/admin/settings`.

### Variables

Todas viven en `.env` (nunca se versiona). `.env.production.example` las lista con su explicación.

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL pública sin `/` final. **Se incrusta al construir**: si cambia, `docker compose build` de nuevo. |
| `PIN_ENCRYPTION_KEY` | Sí | 32 bytes en base64: `openssl rand -base64 32`. Guárdala fuera del VPS; sin ella no se pueden leer los PIN guardados. |
| `SYSADMIN_EMAIL`, `SYSADMIN_NAME`, `SYSADMIN_PASSWORD` | Solo para el seed | Las usa `prisma db seed` (a mano, en una base nueva): crea la cuenta sysadmin de `SYSADMIN_EMAIL` si no existe una cuenta con ese correo, aunque ya haya otro sysadmin. Nunca modifican una cuenta existente: cambiar la contraseña aquí no la cambia. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Token **público** de Mapbox (`pk.`) del mapa de la sede. **Se incrusta al construir.** Sin él, o con un token secreto (`sk.`), la portada muestra el esquema de la sede en lugar del mapa. En el panel de Mapbox restríngelo a la URL del sitio. |
| `SITE_MODE` | No | `landing` (por defecto) o `full`. **Se incrusta al construir**; ver "Kill switch". |
| `ENV_FILE` | No | Archivo de variables del contenedor. Por defecto `.env`; ver "Dos entornos". |
| `APP_PORT` | No | Puerto en `127.0.0.1` para el proxy. Por defecto `3000`. |
| `APP_TAG` | No | Etiqueta de la imagen. Por defecto `latest`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Ver "Correo". |
| `SMTP_EHLO_NAME` | No | Nombre con el que el servidor saluda al SMTP (EHLO), por ejemplo `pixelandcode.tu-dominio.mx`. Sin él se usa el dominio de `NEXT_PUBLIC_SITE_URL`. El relay de Google Workspace (`smtp-relay.gmail.com`) cierra la conexión con `421 4.7.0` si el saludo no es un dominio real. |
| `EMERGENCY_MAIL` | No | Dirección que recibe los avisos de emergencia de producción. Sin ella no se envía ninguno; ver "Avisos de emergencia". |

El contenedor se niega a arrancar si faltan `NEXT_PUBLIC_SITE_URL` o `PIN_ENCRYPTION_KEY` y lo dice en el log.

### Correo (SMTP opcional)

Todos los correos (invitaciones de cuenta, el pasaporte de cada registro, la recuperación por correo, la inscripción al
torneo de KOF, el aviso al ganador de la rifa y los avisos de emergencia) se guardan primero en la tabla `email_outbox`
de la base (RNF-03). Salen con la plantilla del sitio (fondo negro, acento azul, sin esquinas redondeadas;
`src/shared/lib/server/email-template.ts`) y su texto plano como alternativa.

- **Con `SMTP_HOST`** (y `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`, las cinco son obligatorias juntas; si falta
  alguna, el servidor no arranca y el log dice cuál. El remitente es `SMTP_FROM`, por ejemplo
  `UT Game Showcase <no-reply@tu-dominio.mx>`; debe llevar la dirección (solo el nombre no arranca) y `EMAIL_FROM` no se lee. El puerto 465 usa TLS directo y los demás, STARTTLS): cada
  correo sale justo después de la petición y un temporizador reintenta cada minuto los que fallaron, con retroceso
  exponencial.
- **Sin `SMTP_HOST`**: nada sale ni se escribe en el log. Los correos se quedan en `email_outbox` y el temporizador de
  reintentos no se inicia.
  Sirve para pruebas, y en una emergencia se puede entregar el enlace a mano:

```bash
docker compose exec app node -e "
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_URL.slice(5), { readonly: true });
for (const row of db.prepare('SELECT to_address, text FROM email_outbox WHERE sent_at IS NULL ORDER BY created_at').all())
  console.log(row.to_address, (/https?:\/\/\S+/.exec(row.text) || [''])[0]);
"
```

El enlace de invitación vale 72 horas y solo se guarda su hash (RNF-09): este comando es la única forma de verlo.

Cada inicio de sesión del staff pide un código de 6 dígitos que se envía por correo (vence en 10 minutos). Sin
`SMTP_HOST` nadie del staff puede entrar: ese código y los enlaces de "Olvidé mi contraseña" (vencen en 1 hora) también se
quedan en `email_outbox`. Para leer el código en una emergencia usa `SELECT to_address, text FROM email_outbox` en el
comando de arriba y busca el último correo "Tu código para entrar al panel del evento".

### Avisos de emergencia

Con `EMERGENCY_MAIL=guardia@tu-dominio.mx` en `.env`, el servidor manda un correo a esa dirección cuando:

- Next.js atrapa un error en una petición (página, Route Handler, Server Action o proxy; `onRequestError` de
  `src/instrumentation.ts`). El correo nombra el archivo de la ruta (`/activate/[token]`), no la URL visitada, para que
  un token nunca viaje en el aviso.
- La CPU o la memoria pasan de 85 % durante 2 minutos y el bracket público se cierra solo, o falla la vigilancia de
  carga.
- `GET /api/health` responde 503 porque al volumen de la base le quedan menos de 64 MB.

El mismo aviso no se repite durante 15 minutos y salen como máximo 10 avisos por hora, así que una avalancha de errores
no llena el buzón. Los avisos pasan por `email_outbox`; si la base misma falla, se intenta el envío directo por SMTP. Sin
`SMTP_HOST` se quedan en la bandeja como los demás correos. Sin `EMERGENCY_MAIL` no se envía ninguno.

## Contenido inicial

El primer arranque ejecuta el seed del repositorio (`prisma/seed.ts`), que **solo llena tablas vacías**: horarios del
evento, cronograma, los 18 stands con sus juegos de muestra, patrocinadores y el sysadmin. Una base con datos no se
toca, así que reiniciar o actualizar el contenedor no pisa lo que ya editaste. El sysadmin reemplaza los datos de
muestra desde `/admin` (stands, cronograma y cuentas).

### Datos de demostración (solo en una instancia de pruebas)

`db:seed:stands` crea cuentas de staff con una contraseña de ejemplo y 24 pasaportes falsos. **No se corre en
producción.** El seed lo rechaza cuando `NODE_ENV=production`, que es el valor del contenedor; en una instancia de
pruebas (otro VPS, otro proyecto de Compose y otra base) hay que forzarlo de forma explícita:

```bash
docker compose exec -e NODE_ENV=development -e STAND_DEV_PASSWORD='<una-clave-de-prueba>' app npm run db:seed:stands
```

Si por error se corrió en producción, esas cuentas deben desactivarse desde `/admin` y los pasaportes falsos no tienen
datos reales, pero cuentan como visitantes: recrea la base desde un respaldo anterior.

## Prueba de carga

`npm run test:load` simula a muchos teléfonos que abren la portada a la vez: cada usuario pide el HTML y, en su primera
visita, los scripts, estilos e imágenes que el HTML enlaza (después los toma de su caché, como un navegador). Con el kill
switch activo también comprueba que una página bloqueada siga respondiendo con la redirección. No usa dependencias.

```bash
BASE_URL=https://<tu-dominio> USERS=1000 DURATION=60 npm run test:load            # producción (SITE_MODE=landing)
BASE_URL=https://<demo> USERS=300 DURATION=60 CHECK_BLOCKED=0 npm run test:load   # demo (SITE_MODE=full)
```

Imprime peticiones por segundo y los percentiles 50, 95 y 99 de cada tipo de petición, y sale con error si más del 1 %
de las respuestas no es la esperada (`MAX_ERROR_RATE`) o si el p95 del HTML pasa de 1500 ms (`MAX_P95_MS`). Córrela
desde otro equipo, no desde el VPS, y nunca en horario del evento. Detrás de un proxy corporativo agrega
`NODE_USE_ENV_PROXY=1`.

## Actualizar

```bash
cd ut-e3
git pull
docker compose build
docker compose up -d     # recrea el contenedor; las migraciones se aplican solas al arrancar
docker compose ps
docker image prune -f    # opcional: borra las imágenes viejas
docker builder prune -f  # opcional: borra la caché de build (varios GB tras unas cuantas compilaciones)
```

Construir en el VPS usa CPU y unos GB de disco: hazlo antes de abrir el registro, nunca durante el evento, y revisa el
espacio con `docker system df`.

Los datos no se pierden porque la base está en el volumen. Antes de actualizar el día del evento, haz un respaldo (abajo).
Si una migración falla, el contenedor se reinicia en bucle y el log lo muestra (`docker compose logs app`): restaura el
último respaldo y vuelve a la versión anterior con `git checkout <etiqueta> && docker compose up -d --build`.

## Respaldos

RNF-16 pide, además del respaldo diario del proveedor del VPS, un `VACUUM INTO` de SQLite **cada hora el día del
evento**, copiado fuera del VPS. Aquí está el comando; no se automatiza todavía (queda como tarea: `cron` del VPS).

```bash
# Respaldo consistente en el volumen (no detiene la app: SQLite lo hace con una lectura).
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec app sh -c "mkdir -p /data/backups && node -e \"
const Database = require('better-sqlite3');
new Database('/data/app.db').exec(\\\"VACUUM INTO '/data/backups/app-$STAMP.db'\\\");
\""

# Cópialo fuera del VPS (desde tu equipo o desde el VPS hacia un destino remoto).
docker compose cp app:/data/backups/app-$STAMP.db ./app-$STAMP.db
scp ./app-$STAMP.db <usuario>@<destino>:/ruta/de/respaldos/
```

`VACUUM INTO` produce un archivo completo y consistente aunque la app esté escribiendo. Los respaldos del volumen no
cuentan como "fuera del VPS": cópialos y borra los viejos (`docker compose exec app sh -c 'ls /data/backups'`).

**Restaurar** (con la app detenida):

```bash
docker compose stop app
# Borra el WAL de la base actual ANTES de copiar el respaldo: SQLite lo aplicaría encima del respaldo y la base
# quedaría corrupta ("database disk image is malformed"). Revisa que no queden con el ls.
docker compose run --rm --no-deps --user root --entrypoint sh app -c 'rm -f /data/app.db-wal /data/app.db-shm && ls -la /data'
docker compose cp ./app-<fecha>.db app:/data/app.db    # funciona con el contenedor detenido
# docker cp deja el archivo como root; la app corre como "node" y sin este paso la base queda de solo lectura.
docker compose run --rm --no-deps --user root --entrypoint chown app node:node /data/app.db
docker compose up -d
```

Al detenerse con `docker compose stop`, la app cierra SQLite (que integra y borra `app.db-wal` y `app.db-shm`) y, si
alguna conexión sigue abierta, sale sola a los 20 s, antes de los 30 s de `stop_grace_period`. Aun así, un `kill -9`, un
`docker kill` o un corte de luz los dejan: bórralos siempre antes de copiar el respaldo, como arriba. Nunca los borres
con la app corriendo ni sin restaurar un respaldo después, porque ahí están las últimas escrituras.

## Proxy inverso

El proxy termina TLS y pasa todo a `127.0.0.1:3000` (o tu `APP_PORT`). Cuatro cosas importan en esta app:

- **Sin buffering en las respuestas en streaming.** Next.js envía la página por partes (Suspense) y el tiempo real usa
  SSE (RNF-07). Con buffering las páginas se ven lentas y los eventos llegan tarde o nunca.
- **`X-Forwarded-Proto` y `Host`** para que Next.js sepa que la petición original fue por HTTPS.
- **Compresión en el proxy.** La app no comprime sus respuestas (`compress: false` en `next.config.ts`) para que Node
  no gaste CPU en eso durante la llegada del público; los dos bloques de abajo comprimen (`gzip` en Nginx y `encode` en
  Caddy). Sin eso, cada visitante baja el JS y el CSS sin comprimir (unas 4 veces más).
- **`X-Forwarded-For` con la dirección que vio el proxy al final.** Los límites de registro y de inicio de sesión
  (RNF-10) toman la **última** dirección del encabezado, porque las anteriores las escribe el cliente. Los dos bloques
  de abajo ya lo hacen (Nginx con `$proxy_add_x_forwarded_for` y Caddy por defecto). Si pones otro proxy o una CDN
  delante de este, esa última dirección sería la del proxy y todos los visitantes compartirían el límite.

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name showcase.ejemplo.com;

    ssl_certificate     /etc/letsencrypt/live/showcase.ejemplo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/showcase.ejemplo.com/privkey.pem;

    # Comprime aquí y no en Node (next.config.ts tiene compress: false). text/html ya va siempre.
    gzip            on;
    gzip_proxied    any;
    gzip_comp_level 5;
    gzip_types      text/css application/javascript application/json image/svg+xml text/x-component
                    application/manifest+json;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket (si algún día se usa) y conexiones largas.
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "";

        # Streaming y SSE: nada de buffering ni de cortar conexiones ociosas (el heartbeat va cada 20 s).
        proxy_buffering         off;
        proxy_cache             off;
        proxy_read_timeout      1h;
        proxy_send_timeout      1h;
    }
}

server {
    listen 80;
    server_name showcase.ejemplo.com;
    return 301 https://$host$request_uri;
}
```

Si ya usas `Connection "upgrade"` para WebSocket en otros sitios del mismo servidor, define un `map` con
`$connection_upgrade` en lugar de `""`.

### Caddy

```caddyfile
showcase.ejemplo.com {
    # TLS automático (Let's Encrypt). Caddy envía X-Forwarded-Proto y Host por defecto.

    # Comprime aquí y no en Node (next.config.ts tiene compress: false): con 1000 visitantes llegando con la caché
    # vacía, comprimir cada JS y CSS en el único proceso de Node era el techo de la carga.
    # Solo estos tipos: el SSE (text/event-stream) no se comprime para que cada evento salga en cuanto se escribe.
    encode zstd gzip {
        match {
            header Content-Type text/html*
            header Content-Type text/css*
            header Content-Type text/x-component*
            header Content-Type application/javascript*
            header Content-Type application/json*
            header Content-Type application/manifest+json*
            header Content-Type image/svg+xml*
        }
    }

    reverse_proxy 127.0.0.1:3000 {
        # Vacía el buffer en cada escritura: streaming de Next.js y SSE.
        flush_interval -1

        # Hay una sola app: si se reinicia (unos 3 s), Caddy espera hasta 10 s a que vuelva en lugar de responder 502.
        # Sin health_uri: con un chequeo activo, un reinicio dejaba 30 s de "503 no upstreams available" y, con la app
        # saturada, el chequeo vencía y Caddy respondía 503 a todos (la app sí contestaba, lenta).
        lb_try_duration 10s
        lb_try_interval 250ms
    }
}
```

## Operación

```bash
docker compose ps                 # estado y salud
docker compose logs -f app        # log
docker compose restart app        # reinicio ordenado (hasta 30 s para cerrar)
docker compose down               # detiene y quita el contenedor; el volumen se conserva
docker compose down -v            # ¡borra también la base!
```

El reinicio automático (`restart: unless-stopped`) levanta el contenedor si el proceso cae o si el VPS se reinicia
(RNF-17). Docker no lo levanta tras una parada manual: `docker compose stop`, `docker stop` y también `docker kill`
(aunque sea con `-s KILL`) lo dejan detenido hasta un `docker compose up -d`. Para un cambio de `.env` sin cambio de `NEXT_PUBLIC_SITE_URL`, basta `docker compose up -d`.

## Consola SQL (`/admin/sql`)

El sysadmin puede consultar y modificar la base real desde el panel. Antes de usarla en producción:

- **Respalda antes de escribir** (ver "Respaldos"): una escritura confirmada se aplica de inmediato y no se puede deshacer.
- **Es síncrona.** SQLite corre en el mismo hilo del servidor: una consulta lenta (un `JOIN` sin índice sobre tablas
  grandes, un producto cartesiano) bloquea todas las solicitudes mientras dura y nada puede interrumpirla. Las
  lecturas se cortan a 500 filas y un `WITH RECURSIVE` sin `LIMIT` se rechaza, pero eso no frena una consulta que
  tarda antes de devolver la primera fila. Evita usarla durante el evento o con el bracket público abierto.
- **Una sentencia por vez**, solo `SELECT`, `WITH`, `EXPLAIN`, `INSERT`, `UPDATE` y `DELETE`. Se rechazan `ATTACH`,
  `DETACH`, `PRAGMA`, `VACUUM`, `load_extension`, `CREATE`, `DROP` y `ALTER`, y escribir en `_prisma_migrations`,
  `audit_logs` y las tablas `sqlite_*`. Los cambios de esquema siguen siendo migraciones.
- **Las lecturas ven todo**, incluidos datos personales y los hashes de las cuentas. Solo el sysadmin con sesión y
  verificación en dos pasos entra, y cada sentencia queda en la bitácora (`admin.sql.read`, `admin.sql.review` y `admin.sql.write`) con su
  texto y, en las escrituras, las filas cambiadas; nunca el resultado. No pegues contraseñas ni datos personales en la
  sentencia: el texto se guarda tal cual.
- Una escritura exitosa refresca las cachés de la portada (eventos, juegos, cronograma, patrocinadores y PIN de visitantes).
  No toca el bracket de KOF en memoria ni lo que ya esté guardado en el navegador.

## Despliegue continuo (GitHub Actions y Coolify)

El servidor de producción corre en Coolify y no compila (RNF-15). `.github/workflows/deploy.yml` hace el trabajo:

1. Espera a que el workflow `CI` termine bien en un push a `main` (un merge de `develop`). Un CI fallido, o el de un
   PR, no despliega. También se lanza a mano desde la pestaña Actions ("Run workflow" sobre `main`); así solo publica
   si CI ya pasó en ese commit.
2. Construye la imagen con el `Dockerfile` y la publica en GHCR como `ghcr.io/ikabeee/ut-e3:main` y
   `ghcr.io/ikabeee/ut-e3:<commit>`.
3. Pide a Coolify que despliegue la aplicación, espera a que termine y revisa `GET /api/health` del sitio. Si algo
   falla, el job queda en rojo.

La aplicación de Coolify es del tipo "Docker Image" con la imagen `ghcr.io/ikabeee/ut-e3` y la etiqueta `main`, el
volumen persistente en `/data` y las variables de ejecución de "Variables" (`DATABASE_URL=file:/data/app.db`,
`NEXT_PUBLIC_SITE_URL`, `PIN_ENCRYPTION_KEY`, `SYSADMIN_*`, `SMTP_*` y el mismo `SITE_MODE` con el que se construyó la imagen: si no coinciden,
el contenedor no arranca).

Configuración en GitHub (Settings, "Secrets and variables", Actions):

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Variable | URL pública sin `/` final. Se incrusta al construir. |
| `SITE_MODE` | Variable | `landing` o `full`. Cambiarlo exige cambiar también `SITE_MODE` en Coolify. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Variable (opcional) | Token público de Mapbox (`pk.`). |
| `COOLIFY_URL` | Variable | URL del panel de Coolify, sin `/` final. |
| `COOLIFY_APP_UUID` | Variable | UUID de la aplicación en Coolify. |
| `COOLIFY_API_TOKEN` | Secreto | Token de API de Coolify con permiso `deploy` (Keys & Tokens, API tokens). |

Volver a una versión anterior: en Coolify, cambia la etiqueta de la imagen por el commit que quieres (las etiquetas
viejas siguen en GHCR) y despliega, o usa "Rollback". Las migraciones no se deshacen: restaura un respaldo si la
versión nueva cambió la base.

## Qué no cubre esta guía

- **Respaldo horario automático** (RNF-16) y la copia fuera del VPS: solo está el comando.
- **Prueba de carga en el VPS** antes del 13 de noviembre (RNF-18).
