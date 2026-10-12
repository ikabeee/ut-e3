# syntax=docker/dockerfile:1
#
# Imagen de la plataforma (Next.js `standalone`) y de las migraciones de Prisma 8.
# Úsala con docker-compose.yml; los pasos están en docs/data-sources.md.
#
# Targets:
#   migrate  aplica las migraciones y los seeds (tiene todas las dependencias y el CLI de Prisma)
#   runner   sirve el sitio con `node server.js` (imagen final, sin dependencias de desarrollo)
#
# Con `DATA_SOURCE=prisma`, el build prerenderiza el catálogo con datos de la base y necesita
# `DATABASE_URL` (sólo existe en la etapa `builder`; no llega a la imagen final). Con
# `DATA_SOURCE=mock` (los juegos del diseño) no necesita la base.

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1

# 1. Dependencias: se reconstruye sólo cuando cambia package-lock.json.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Migraciones y seeds de la base de datos.
FROM deps AS migrate
COPY prisma.config.ts ./
COPY migrations ./migrations
COPY src/shared/lib/prisma ./src/shared/lib/prisma
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed"]

# 3. Build de Next.js.
FROM deps AS builder
COPY . .
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG DATA_SOURCE=mock
ENV DATABASE_URL=${DATABASE_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    DATA_SOURCE=${DATA_SOURCE}
RUN npm run build

# 4. Imagen final: sólo el servidor standalone, `public/` y los estáticos.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
