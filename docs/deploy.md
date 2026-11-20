# Despliegue con Docker

Guía para publicar la app en un VPS que ya tiene otras aplicaciones y su propio proxy inverso. Este repositorio trae
el `Dockerfile` y el `docker-compose.yml`; el proxy (Nginx o Caddy) lo pones tú y apunta a `127.0.0.1:APP_PORT`.

## Qué hay

| Archivo | Para qué |
| --- | --- |
| `Dockerfile` | Imagen en tres etapas con Node 22: compila (`prisma generate` y `next build`), arma las dependencias de arranque y deja una imagen final sin compiladores. Corre como el usuario `node` (no root). |
| `docker/entrypoint.sh` | Al arrancar aplica las migraciones pendientes (`prisma migrate deploy`), corre el alta masiva del staff si existe su lista (ver "Alta masiva del staff") y deja `node server.js` como proceso principal. |
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
| `SMTP_EHLO_NAME` | No | Nombre con el que el servidor saluda al SMTP (EHLO), por ejemplo `pixelandcode.tu-dominio.mx`. Sin él se usa el dominio de `NEXT_PUBLIC_SITE_URL`; sin ninguno de los dos en el entorno, el dominio con el que se construyó la imagen (localhost nunca se anuncia). El relay de Google Workspace (`smtp-relay.gmail.com`) cierra la conexión con `421 4.7.0` si el saludo no es un dominio real. |
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
  correo sale justo después de la petición y un temporizador reintenta cada minuto los que fallaron. El envío usa una
  sola conexión SMTP reutilizada, como máximo un mensaje cada 2 segundos y 10 correos por pasada. Si el proveedor responde
  con un error temporal (por ejemplo Gmail `421 4.7.0 Try again later`), la pasada se detiene y el correo espera 15 min,
  30 min, 1 h y 2 h (con una variación de hasta el 50 %) antes de cada reintento, así que sus 5 intentos abarcan entre 2
  y casi 4 horas. Un error permanente (5xx) abandona el correo de inmediato.
- **Panel de correos** (`/admin/emails`, solo sysadmin): lista toda la bandeja con filtros (estado, destinatario, asunto
  y fecha de cola) y muestra intentos, próximo intento, último error y el destinatario completo. Desde ahí se puede ver el
  texto de un correo mientras exista (la lectura queda en la bitácora como `admin.email.view`), reenviar uno o todos los
  fallidos con contenido (`admin.email.resend`, `admin.email.resend_failed`), correr la entrega al momento con "Enviar
  ahora" (`admin.email.send_now`, necesita `SMTP_HOST`) y **rehacer** un correo abandonado cuyo texto se borró
  (`admin.email.rebuild`): el pasaporte (con su PIN), el enlace de recuperación, la inscripción al KOF, la invitación de
  staff, el restablecimiento de contraseña y el aviso al ganador de la rifa se escriben de nuevo desde el registro del que
  salían (columnas `kind` y `reference_id`); los enlaces son nuevos y el correo abandonado se reemplaza por el nuevo. Un
  código de inicio de sesión no se rehace (la persona vuelve a iniciar sesión), tampoco un aviso de emergencia ni un
  correo puesto en cola antes de la migración `20261120100000_outbox_kind`, que no tiene tipo. Para esos, corre una vez
  `docker compose exec app npm run db:backfill:email-kinds`: asigna tipo y referencia a los no enviados cuyo asunto sea el
  del pasaporte o el de recuperación y cuyo visitante se encuentre por correo (y gamertag); los demás no se tocan. Cada
  cambio queda en la bitácora como `admin.email.backfill_kind`, y después se usa "Rehacer".
  Si el sysadmin no puede entrar al panel (por ejemplo, porque los códigos de inicio de sesión no llegan mientras dura el
  límite de Gmail), `docker compose exec app npm run db:rebuild-abandoned` rehace de una vez todos los abandonados que
  se pueden rehacer, con enlaces y PIN nuevos, y los deja en cola para el trabajador de correo (no envía nada). Omite los
  códigos de inicio de sesión, los avisos de emergencia y los que no tienen tipo o referencia; cada rehecho queda en la
  bitácora como `admin.email.rebuild` sin actor, y una segunda corrida no encuentra nada que rehacer. El comando termina
  con código 1 si alguno falló (el resto se rehace igual).
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

Para que una base que ya tiene patrocinadores reciba los nuevos de la lista inicial (`INITIAL_SPONSORS`), se corre una
vez tras desplegar (los logos nuevos viajan en `public/sponsors/` con la imagen):

```bash
docker compose exec app npm run db:backfill:sponsors
```

Agrega los patrocinadores que faltan (se comparan por nombre, sin importar mayúsculas) después de la última posición y,
en los que ya existen, llena solo los campos vacíos (sitio, teléfono, correo y servicios): nunca pisa lo que el sysadmin
editó. Se puede repetir sin efecto. Valida cada entrada como el formulario del panel y falla, sin escribir nada, si falta
un logo en `public/`. Después hay que reiniciar la app, porque la portada y `/sponsors` están en caché.

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

## Recuperación de servicios (`/admin/recovery`)

Pantalla del sysadmin para levantar un servicio caído sin entrar al VPS. Antes de usarla en producción:

- **Correo.** Muestra si hay `SMTP_HOST` (solo el servidor, nunca el usuario ni la clave), la última corrida del
  trabajador y su último error, y los conteos de la bandeja. "Probar SMTP" envía un correo directo (sin pasar por la
  bandeja) a la cuenta del sysadmin y muestra el error exacto del servidor. "Reintentar envíos ahora" corre la entrega
  de la bandeja en ese momento; los correos que siguen en su espera de reintento (backoff) esperan su turno y los
  abandonados no se rehacen. "Reiniciar el trabajador de correo" borra y vuelve a crear el intervalo de 60 s; si el
  proceso arrancó sin `SMTP_HOST`, no hay trabajador y la acción lo dice (cambiar variables requiere reiniciar la app).
- **Vigilancia de carga.** Mismo estado y el mismo reinicio para la lectura cada 10 s que cierra el bracket público.
  Los intervalos viven en el registro de `@shared/lib/server/background-jobs`; un reinicio de la app los vuelve a crear.
- **Base de datos.** Tamaño del archivo, del WAL y del SHM y espacio libre del volumen. "Revisar integridad"
  (`PRAGMA quick_check`) y "Vaciar el WAL" (`PRAGMA wal_checkpoint(TRUNCATE)`) corren al pedirlos y bloquean el
  servidor mientras duran: evítalos con el bracket público abierto en pleno evento. El vaciado puede decir que no
  terminó si hay lecturas o escrituras en curso; se repite.
- **Descargar respaldo.** Hace una copia consistente con la API de respaldo en línea de SQLite (la app sigue
  escribiendo), en una carpeta temporal privada, la envía como descarga (`Cache-Control: no-store`) y la borra al
  terminar o si se cancela. **El respaldo contiene todos los datos personales y los hashes de las cuentas**: guárdalo
  en un lugar privado y bórralo cuando ya no lo necesites. Cada descarga queda en la bitácora (`admin.recovery.backup_download`)
  con su tamaño. No sustituye al respaldo por hora de RNF-16 (ver "Respaldos"); la restauración sigue siendo la de esa sección.
- **Cachés públicas.** "Invalidar cachés públicas" expira todas las etiquetas de `cacheTag()` de `src/`
  (`PUBLIC_CACHE_TAGS`); una prueba falla si se agrega una etiqueta nueva y no está en esa lista.
- **Bitácora.** Cada acción deja `admin.recovery.*` (`smtp_test`, `retry_emails`, `restart`, `quick_check`,
  `checkpoint`, `invalidate_caches`, `backup_download`); abrir o cerrar el bracket usa su entrada de siempre.

## Cuentas del staff (`/admin/accounts`)

Solo el sysadmin. Lista las cuentas de todos los roles con filtros (rol, estado, stand) y búsqueda por nombre o correo.
Cada acción queda en la bitácora de auditoría (`account.*`) y ninguna guarda el correo ni el enlace en el detalle.

- **Desactivar** cierra las sesiones de la cuenta. Un sysadmin no puede desactivarse a sí mismo ni desactivar al último
  sysadmin activo (un trigger de la base lo garantiza aunque dos lo intenten a la vez; el error es `last_sysadmin`): si perdiste el acceso de todos, el remedio es `SYSADMIN_EMAIL` en el seed o la consola SQL.
- **Reactivar** devuelve la cuenta a `invited` con una invitación nueva de 72 horas (se borra su contraseña) y respeta
  los límites: un administrador activo por stand, 3 staff por stand y un staff por mesa del KOF.
- **Enviar restablecimiento de contraseña** manda el enlace de 1 hora de "Olvidé mi contraseña" a una cuenta activa. No se
  salta el límite: cuenta 3 envíos por hora y por cuenta en un contador propio (`admin-password-reset:<id>`), que no gasta
  ni depende del límite de quien lo pide solo.
- **Cerrar sesiones** borra todas las sesiones de la cuenta. **Limpiar 2FA pendiente** borra sus códigos de acceso
  pendientes; la persona vuelve a empezar desde la contraseña.
- **Invitar** acepta cualquier rol. Las cuentas de stand llevan el stand; el staff de KOF, su mesa.
- **Rol secundario**: un administrador de stand puede tener además `help_desk`, `kof_admin`, `raffle_admin` o `sysadmin`
  en la misma cuenta. Solo el sysadmin lo da o lo quita (`account.secondary_role` en la bitácora). Un sysadmin secundario
  cuenta para la regla del último sysadmin activo, y los encabezados enlazan de un área a la otra.
- El último acceso sale de la bitácora (`account.login_verified`); la fecha de alta es `accounts.created_at`.
## Alta masiva del staff

Crea de una vez las cuentas del staff como invitaciones, con su rol secundario y su mesa de KOF, y los stands que falten.
Sirve para cargar la lista del evento en el primer despliegue; después las cuentas se invitan desde `/admin/accounts` y
`/stand/team`. El comando es `npm run db:invite:staff [archivo.csv]` (`prisma/invite-staff.ts`).

**El archivo.** Es un CSV en UTF-8 con coma, fuera de git porque lleva correos de alumnos. Va en el volumen de la app,
por defecto en `/data/staff-invitations.csv` (otra ruta con la variable `STAFF_INVITATIONS_CSV` o como argumento del
comando). La primera línea es el encabezado exacto:

```
email,name,role,secondary_role,stand,kof_desk
```

| Columna | Qué lleva |
| --- | --- |
| `email` | Correo de la persona; se guarda en minúsculas y sin espacios. Una fila sin correo se omite y se reporta (no es un error): después la invita su administrador o el sysadmin. |
| `name` | Nombre completo. Entre comillas si lleva coma. |
| `role` | `sysadmin`, `stand_admin`, `stand_staff`, `raffle_admin`, `kof_admin`, `kof_staff` o `help_desk`. |
| `secondary_role` | Vacío, o `help_desk`, `kof_admin`, `raffle_admin` o `sysadmin` solo cuando `role` es `stand_admin`. |
| `stand` | Grupo y estudio, como `101-5`, solo para `stand_admin` y `stand_staff` (obligatorio en ellos). Se busca en los 18 stands del evento (`INITIAL_STANDS`). |
| `kof_desk` | Mesa del 1 al 4, solo para `kof_staff` (obligatoria en él). |

```
email,name,role,secondary_role,stand,kof_desk
lider@ejemplo.mx,Ana Pérez,stand_admin,kof_admin,101-5,
staff@ejemplo.mx,Luis Gómez,stand_staff,,101-5,
mesa@ejemplo.mx,Eva Ruiz,kof_staff,,,2
```

**Qué hace.** Primero valida toda la lista y revisa contra la base lo que esta rechazaría (un stand que no es del
evento, un stand que ya tiene administrador o sus 3 staff, una mesa ocupada, más de 18 stands). Un correo que ya tiene
pasaporte de visitante sí se invita: el mismo correo puede ser staff y visitante, y el kiosco de su propio stand rechaza
su PIN. Si algo falla, escribe los errores con su línea y **no escribe nada**. Si todo está bien, en una sola
transacción crea los stands de `INITIAL_STANDS` que no existen (los que ya existen no se tocan) y una cuenta `invited`
por cada correo sin cuenta, con su invitación de 72 horas y su correo en `email_outbox` (tipo `staff_invitation`). Un
correo que ya tiene cuenta no se toca y se reporta por su línea. Lo hace "el sistema": las cuentas no tienen
`created_by_id` y las entradas de la bitácora no tienen actor, porque ninguna cuenta del staff lo ejecutó.

**Cuándo corre.** En cada arranque, `docker/entrypoint.sh` lo corre después de `prisma migrate deploy` solo si el archivo
existe. Corre **una sola vez**: al terminar deja la entrada `staff.bulk_invite` en la bitácora (con los conteos, sin
correos) y los arranques siguientes no hacen nada ni leen el archivo, aunque la lista cambie. Si falla, el servidor
arranca igual (el error queda en el log del contenedor) y, como no escribió nada, el siguiente arranque lo intenta otra
vez: se corrige la lista y se reinicia. Si todo salió bien, se puede borrar el archivo del volumen.

El tamaño de la lista no la limita el correo: las invitaciones quedan en la cola y las envía el trabajador de correo a su
ritmo (un mensaje cada 2 segundos, 10 por minuto; ver "Correo"), así que unas 70 tardan unos 7 minutos. El script no envía
nada por sí mismo.

**Revisar el resultado.**

- `/admin/accounts`: las cuentas nuevas en estado "Invitada", con su rol, stand y mesa.
- `/admin/emails`: un correo "Invitación de staff" por cuenta, y su estado (en cola, enviado o fallido).
- `/admin/logs`: la bitácora con la entrada `staff.bulk_invite` (conteos de stands, invitaciones, omitidos y existentes),
  `account.invite` por cuenta y `stand.create` por stand. El resumen con las líneas omitidas y existentes sale en el log
  del contenedor (`docker compose logs app`).

**Reenviar.** El alta no se repite, pero el sysadmin reenvía lo que haga falta con lo que ya existe: "Reenviar
invitación" en `/admin/accounts` (genera un enlace nuevo de 72 horas y el anterior deja de servir) o, para un correo
fallido, "Reenviar" y "Rehacer" en `/admin/emails`. Para una persona nueva o a quien se omitió, se invita desde
`/admin/accounts` o la invita su administrador de stand desde `/stand/team`. Para correr la carga otra vez con otra lista
(por ejemplo en una base de pruebas) hace falta una base sin la entrada `staff.bulk_invite`.

## Logs del servidor (`/admin/logs`)

El sysadmin ve dos registros en el panel (`/admin/logs`):

- **Bitácora:** la tabla `audit_logs`, con filtros por actor, acción, entidad y fechas, en páginas de 25. Es de solo
  inserción.
- **Servidor:** la tabla `server_logs`. Sobrevive a los reinicios, se filtra por nivel (`error`, `warn`, `info`), origen
  (`request`, `email`, `overload`, `emergency`, `worker`, `console`), texto y fechas, y puede actualizarse sola cada 15 s.

Qué se guarda, desde `logServerEvent(level, source, message, details)` (`src/shared/lib/server/server-log.ts`):

- Los errores que Next.js atrapa en una petición: la ruta (`/activate/[token]`), el método y el `digest`; nunca la URL visitada.
- El resultado de cada correo de la bandeja: enviado, fallido (se reintenta) o abandonado, con el asunto y el destinatario
  enmascarado (`j***@ut.mx`); nunca el texto del correo.
- Los avisos de emergencia que salen, el cierre automático del bracket y las fallas de la vigilancia de carga, de la
  entrega de correos y de la propia purga.
- Todo lo que el código del servidor imprime con `console.error` y `console.warn` (origen `console`). Se guardan como
  máximo 30 por minuto, para que una avalancha de errores no llene la tabla; la consola del contenedor los imprime siempre.

Antes de guardar se ocultan los tokens (la query de una URL y los segmentos largos de una ruta), los códigos de 6 dígitos,
las contraseñas y las direcciones de correo (`j***@ut.mx`). Es una red de seguridad, no una garantía: no imprimas datos
personales en el servidor. Si la base falla, el evento se imprime en la consola del contenedor y no se pierde.

Retención: cada hora, y al arrancar, se borran las filas de más de 30 días. La purga es un trabajo del registro de
trabajos (`server-log-retention`), así que `/admin/recovery` muestra su última corrida y su último error. "Purgar ahora" hace lo mismo desde el panel y
deja una entrada `admin.server_logs.purge` en la bitácora con quién lo hizo y cuántas filas borró. La tabla se puede
consultar en `/admin/sql`, pero la purga no borra nada más reciente de 30 días.

## Despliegue continuo (GitHub Actions y Coolify)

El servidor de producción corre en Coolify y no compila (RNF-15). `.github/workflows/deploy.yml` hace el trabajo:

1. Espera a que el workflow `CI` termine bien en un push a `main` (un merge de `develop`). Un CI fallido, o el de un
   PR, no despliega. También se lanza a mano desde la pestaña Actions ("Run workflow" sobre `main`); así solo publica
   si CI ya pasó en ese commit.
2. Construye la imagen con el `Dockerfile` y la publica en GHCR como `ghcr.io/ikabeee/ut-e3:main` y
   `ghcr.io/ikabeee/ut-e3:<commit>`.
3. Pide a Coolify que despliegue la aplicación, espera a que termine y revisa `GET /api/health` del sitio. Si algo
   falla, el job queda en rojo.
4. Si el despliegue terminó bien, el job `release` crea la etiqueta `vX.Y.Z` (la versión de `package.json`) y su Release
   de GitHub con las notas de la sección `## [X.Y.Z]` del `CHANGELOG.md` (`tools/release/changelog-section.mjs`). Es el
   único job con `permissions: contents: write`; los demás solo leen. Si la etiqueta ya existe (un redespliegue o un
   hotfix sin subir la versión), no hace nada; si falta la sección del CHANGELOG, falla con un error que lo dice.

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
