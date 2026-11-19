#!/bin/sh
# Arranque del contenedor: migra la base y deja el servidor como proceso principal para que reciba la senal de apagado (docker stop) y cierre con orden.
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

# El seed no corre al arrancar: produccion ya tiene sus datos. En una base nueva se corre una vez a mano
# (docs/deploy.md, "Primer despliegue").

# Alta masiva del staff (docs/deploy.md): solo si existe la lista. El script corre una sola vez (deja `staff.bulk_invite`
# en la bitacora y los arranques siguientes no hacen nada) y deja los correos en la cola; los envia el trabajador de
# correo. Si falla (lista invalida, base ocupada) se registra y el servidor arranca igual: un sitio sin invitaciones se
# arregla corrigiendo la lista y reiniciando, uno que no arranca deja a todos los visitantes sin el sitio. Como no
# escribe nada cuando falla, el siguiente arranque lo intenta otra vez.
STAFF_INVITATIONS_CSV="${STAFF_INVITATIONS_CSV:-/data/staff-invitations.csv}"
export STAFF_INVITATIONS_CSV

if [ -f "$STAFF_INVITATIONS_CSV" ]; then
  tsx --conditions=react-server prisma/invite-staff.ts \
    || echo "El alta masiva del staff fallo; el servidor arranca sin ella. Corrige la lista y reinicia (docs/deploy.md, Alta masiva del staff)." >&2
fi

exec node server.js
