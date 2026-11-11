#!/bin/sh
# Arranque del contenedor: migra la base, carga el contenido inicial y la cuenta del sysadmin, y deja el servidor como
# proceso principal para que reciba la senal de apagado (docker stop) y cierre con orden.
set -eu

: "${NEXT_PUBLIC_SITE_URL:?Falta NEXT_PUBLIC_SITE_URL en el .env}"
: "${PIN_ENCRYPTION_KEY:?Falta PIN_ENCRYPTION_KEY en el .env (openssl rand -base64 32)}"

# Kill switch: la portada se compilo con un SITE_MODE y el servidor debe bloquear con el mismo. Distintos, la portada
# enlazaria a paginas bloqueadas (o se publicaria lo que debia quedar cerrado), asi que el contenedor no arranca.
BUILT_SITE_MODE="$(cat .site-mode)"
if [ "${SITE_MODE:-$BUILT_SITE_MODE}" != "$BUILT_SITE_MODE" ]; then
  echo "SITE_MODE=${SITE_MODE} no coincide con el de la imagen (${BUILT_SITE_MODE}). Reconstruye con el modo que quieres." >&2
  exit 1
fi

# Aplica solo las migraciones pendientes; con la base al dia no hace nada.
prisma migrate deploy

# Llena las tablas vacias y crea al sysadmin si todavia no hay uno (SYSADMIN_EMAIL, SYSADMIN_NAME, SYSADMIN_PASSWORD).
# Una base con datos no se toca, asi que repetirlo en cada arranque es seguro.
prisma db seed

exec node server.js
