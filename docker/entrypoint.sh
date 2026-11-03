#!/bin/sh
# Arranque del contenedor: migra la base, carga el contenido inicial y la cuenta del sysadmin, y deja el servidor como
# proceso principal para que reciba la senal de apagado (docker stop) y cierre con orden.
set -eu

: "${NEXT_PUBLIC_SITE_URL:?Falta NEXT_PUBLIC_SITE_URL en el .env}"
: "${PIN_ENCRYPTION_KEY:?Falta PIN_ENCRYPTION_KEY en el .env (openssl rand -base64 32)}"

# Aplica solo las migraciones pendientes; con la base al dia no hace nada.
prisma migrate deploy

# Llena las tablas vacias y crea al sysadmin si todavia no hay uno (SYSADMIN_EMAIL, SYSADMIN_NAME, SYSADMIN_PASSWORD).
# Una base con datos no se toca, asi que repetirlo en cada arranque es seguro.
prisma db seed

exec node server.js
