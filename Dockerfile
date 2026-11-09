# syntax=docker/dockerfile:1
#
# Imagen de produccion (docs/deploy.md). Tres etapas: `build` compila con todas las dependencias, `runtime-deps` arma
# las dependencias que necesita el contenedor al arrancar y `runner` es la imagen final, sin compiladores ni codigo de
# pruebas. Node 22, el mismo que usa el CI y .nvmrc.

FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1

# better-sqlite3 es un modulo nativo: baja un binario precompilado y, si no hay uno para la arquitectura, lo compila.
FROM base AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git make g++ python3 \
    && rm -rf /var/lib/apt/lists/*

# eslint-plugin-readable-code es una dependencia de GitHub con URL ssh en el lockfile; el contenedor no tiene llaves ssh.
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

WORKDIR /app

# `npm ci` ejecuta `prisma generate` (postinstall), que necesita el esquema y la configuracion.
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# Las consultas con "use cache" leen la base durante el build (igual que en el CI): se migra y se carga una SQLite
# temporal que no llega a la imagen final.
ARG NEXT_PUBLIC_SITE_URL
# Kill switch (docs/deploy.md): la portada se compila sin los enlaces que el modo `landing` bloquea.
ARG SITE_MODE=landing
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    SITE_MODE=${SITE_MODE} \
    DATABASE_URL=file:/tmp/build.db

RUN test -n "$NEXT_PUBLIC_SITE_URL" || (echo "Falta el argumento NEXT_PUBLIC_SITE_URL (por ejemplo https://showcase.ejemplo.com)." && exit 1)
RUN case "$SITE_MODE" in landing|full) ;; *) echo "SITE_MODE debe ser landing o full (recibido: $SITE_MODE)." && exit 1 ;; esac
RUN npx prisma migrate deploy && npx prisma db seed && npm run build && rm -f /tmp/build.db*

FROM base AS runtime-deps

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates make g++ python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

# El contenedor aplica las migraciones y el seed al arrancar, asi que ademas de las dependencias de produccion lleva la
# CLI de Prisma, tsx y @next/env (las usan prisma7.config.ts y prisma/seed.ts) con las versiones del package.json.
RUN npm ci --omit=dev --ignore-scripts \
    && npm install --no-save --ignore-scripts \
        "prisma@$(node -p "require('./package.json').devDependencies.prisma")" \
        "tsx@$(node -p "require('./package.json').devDependencies.tsx")" \
        "@next/env@$(node -p "require('./package.json').devDependencies['@next/env']")" \
    && npm rebuild better-sqlite3 esbuild @prisma/engines \
    && npm cache clean --force

FROM base AS runner

# El servidor bloquea lo mismo que se compilo: la imagen lleva el modo con el que se construyo.
ARG SITE_MODE=landing

# Prisma necesita OpenSSL para su motor de migraciones.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /data \
    && chown node:node /data

ENV NODE_ENV=production \
    SITE_MODE=${SITE_MODE} \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:/data/app.db \
    PATH=/app/node_modules/.bin:$PATH

WORKDIR /app

COPY --from=runtime-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/generated ./generated
COPY --chown=node:node package.json tsconfig.json prisma7.config.ts ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src
COPY --chown=node:node docker/entrypoint.sh ./docker/entrypoint.sh

USER node

# La base vive en un volumen: sobrevive a las actualizaciones de la imagen.
VOLUME /data

EXPOSE 3000

# Da tiempo a las migraciones y al seed del primer arranque antes de contar los fallos.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"

ENTRYPOINT ["sh", "docker/entrypoint.sh"]
