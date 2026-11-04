# Despliegue con Docker

Guía para publicar la app en un VPS que ya tiene otras aplicaciones y su propio proxy inverso. Este repositorio trae
el `Dockerfile` y el `docker-compose.yml`; el proxy (Nginx o Caddy) lo pones tú y apunta a `127.0.0.1:APP_PORT`.

## Qué hay

| Archivo | Para qué |
| --- | --- |
| `Dockerfile` | Imagen en tres etapas con Node 22: compila (`prisma generate` y `next build`), arma las dependencias de arranque y deja una imagen final sin compiladores. Corre como el usuario `node` (no root). |
| `docker/entrypoint.sh` | Al arrancar aplica las migraciones pendientes (`prisma migrate deploy`), carga el contenido inicial y la cuenta del sysadmin (`prisma db seed`) y deja `node server.js` como proceso principal. |
| `docker-compose.yml` | Un servicio `app`, volumen `app-data` con la base SQLite, reinicio automático y `stop_grace_period: 30s`. Publica solo en `127.0.0.1`. |
| `.env.production.example` | Plantilla de variables. Se copia a `.env` en el VPS. |
| `GET /api/health` | Ruta ligera que usa el `HEALTHCHECK` de la imagen. No toca la base. |

La base vive en `/data/app.db` dentro del contenedor, en el volumen `app-data`. Está en modo WAL con `busy_timeout`
(RNF-08); el código lo configura al abrir cada conexión.

## Primer despliegue

Requisitos en el VPS: Docker con el plugin Compose y acceso a internet para construir (npm y GitHub).

```bash
git clone <url-del-repositorio> ut-e3 && cd ut-e3
git checkout main        # o la etiqueta de la versión que vas a publicar

cp .env.production.example .env
nano .env                # llena los valores; ver "Variables"

docker compose build
docker compose up -d
docker compose ps        # espera el estado "healthy" (el primer arranque tarda por las migraciones y el seed)
curl -s http://127.0.0.1:3000/api/health
```

Después configura el proxy inverso (ver más abajo). Entra a `https://<tu-dominio>/login` con `SYSADMIN_EMAIL` y
`SYSADMIN_PASSWORD`.

### Variables

Todas viven en `.env` (nunca se versiona). `.env.production.example` las lista con su explicación.

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL pública sin `/` final. **Se incrusta al construir**: si cambia, `docker compose build` de nuevo. |
| `PIN_ENCRYPTION_KEY` | Sí | 32 bytes en base64: `openssl rand -base64 32`. Guárdala fuera del VPS; sin ella no se pueden leer los PIN guardados. |
| `SYSADMIN_EMAIL`, `SYSADMIN_NAME`, `SYSADMIN_PASSWORD` | Sí, la primera vez | Crean la cuenta del sysadmin solo si todavía no existe uno. Si ya existe, se ignoran: cambiar la contraseña aquí no la cambia. |
| `APP_PORT` | No | Puerto en `127.0.0.1` para el proxy. Por defecto `3000`. |
| `APP_TAG` | No | Etiqueta de la imagen. Por defecto `latest`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Ver "Correo". |

El contenedor se niega a arrancar si faltan `NEXT_PUBLIC_SITE_URL` o `PIN_ENCRYPTION_KEY` y lo dice en el log.

### Correo (SMTP opcional)

Los correos (hoy, las invitaciones de cuenta) se guardan primero en la tabla `email_outbox` de la base (RNF-03).

- **Con `SMTP_HOST`** (y `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`, las cinco son obligatorias juntas): cada
  correo sale justo después de la petición y un temporizador reintenta cada minuto los que fallaron, con retroceso
  exponencial.
- **Sin `SMTP_HOST`**: nada sale. Los correos se quedan en `email_outbox` y el temporizador de reintentos no se inicia.
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

## Actualizar

```bash
cd ut-e3
git pull
docker compose build
docker compose up -d     # recrea el contenedor; las migraciones se aplican solas al arrancar
docker compose ps
docker image prune -f    # opcional: borra las imágenes viejas
```

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

El proxy termina TLS y pasa todo a `127.0.0.1:3000` (o tu `APP_PORT`). Tres cosas importan en esta app:

- **Sin buffering en las respuestas en streaming.** Next.js envía la página por partes (Suspense) y el tiempo real usa
  SSE (RNF-07). Con buffering las páginas se ven lentas y los eventos llegan tarde o nunca.
- **`X-Forwarded-Proto` y `Host`** para que Next.js sepa que la petición original fue por HTTPS.
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
    reverse_proxy 127.0.0.1:3000 {
        # Vacía el buffer en cada escritura: streaming de Next.js y SSE.
        flush_interval -1

        # Verificación de salud de la app.
        health_uri /api/health
        health_interval 30s
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
(RNF-17). Para un cambio de `.env` sin cambio de `NEXT_PUBLIC_SITE_URL`, basta `docker compose up -d`.

## Qué no cubre esta guía

- **Imagen construida en GitHub Actions** (RNF-15): hoy la imagen se construye en el VPS con `docker compose build`.
- **Respaldo horario automático** (RNF-16) y la copia fuera del VPS: solo está el comando.
- **Prueba de carga en el VPS** antes del 13 de noviembre (RNF-18).
