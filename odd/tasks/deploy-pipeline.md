# Despliegue continuo con GitHub Actions y Coolify

Rama `feature/deploy-pipeline` desde `develop`. La imagen se construye en Actions (RNF-15), se publica en GHCR y Coolify
la despliega. Antes, la imagen de Coolify salía de la rama `deploy-image` y el redeploy era manual.

## Specs

- S1: "configures el despliegue el la aplicacion" con "el pipeline los configures desde actions porque tengo minutos de
  sobra".
- S2: Rama que dispara el despliegue: "main (recomendado)".
- S3: Puerta de calidad: "Sí, quality antes de publicar".
- S4: Modo del sitio: "landing".
- S5: "antes pon al dia las ramas en local".

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S5 | inline: `git fetch --all --prune`; las ramas locales ya estaban al día con `origin` | - |
| T2 | S1-S4 | inline: `.github/workflows/deploy.yml`, `docs/deploy.md`, `CHANGELOG.md` | `ci(deploy): construir la imagen en Actions...` |
| T3 | S1, S4 | inline: variables de GitHub (`NEXT_PUBLIC_SITE_URL`, `SITE_MODE`, `COOLIFY_URL`, `COOLIFY_APP_UUID`) | hecho (gh variable set) |
| T4 | S1, S4 | al hacer merge a main: secreto `COOLIFY_API_TOKEN`, etiqueta `main` y `SITE_MODE=landing` en Coolify | pendiente |

## Log

- L1: "Ahora necesito que configures el despliegue el la aplicacion (antes pon al dia las ramas en local), aqui
  necesito que el pipeline los configures desde actions porque tengo minutos de sobra"
- L2: Decisiones del usuario: rama `main`, quality antes de publicar, `SITE_MODE=landing`.
- L3: Coolify: app `qcrwkkewgonniklus3djtrdc` (Docker Image `ghcr.io/ikabeee/ut-e3:full`, volumen `/data`,
  https://pixelandcode.algorixinsights.com). La rama remota `deploy-image` tiene 2 commits de patrocinadores (subir
  logo) que no están en `main`.
- L4: Verificación independiente (gentle-ai-verify): sin bloqueos; corregidos D1 (el lanzamiento manual exige CI verde
  en el commit), D2 (falta `NEXT_PUBLIC_SITE_URL` en las variables de Coolify del doc), D3 y D4 (errores de curl).
