# Patrocinadores restantes y arte de los juegos

Estado: planificado, sin implementar.
Hay que dar de alta los patrocinadores que faltan con datos uniformes, completando por scraping lo que no venga en sus
carpetas, y cargar las portadas y el arte de los juegos que faltan.

## Specs

- **S1. Patrocinadores restantes, uniformes.** Pedido: "en el odd debemos agregar a los patrocinadores restantes, hay
  que hacer un scrapping para conseguir su informacion faltan en caso de que falte informacion, TODOS DEBEN QUEDAR
  UNIFORMES (LOS NEGOCIOS SON DE CANCUN". Fuente: `/Users/carlglzm/Downloads/GENERAL - PATROCINADORES`.
- **S2. Portadas y arte que faltan.** Pedido: "/Users/carlglzm/Downloads/portadas tambien las portadas o arte que
  falta dentro de esta carpeta".

## Tasks

| ID | Specs | Qué | Ruta | Riesgo | Commit |
|---|---|---|---|---|---|
| T1 | S1 | Scraping de los negocios de Cancún (sitio, redes, Google Maps) para llenar lo que falta de cada patrocinador: `websiteUrl` (https), `phone` (`+52…`), `email` y `services` (máximo 200 caracteres). Cada dato lleva su fuente en el Log; si un dato no se encuentra, se reporta y no se inventa. | Investigación web (solo lectura) | ninguno | sin commit |
| T2 | S1 | Logos en `public/sponsors/<slug>.svg`, o `.png` con fondo transparente, recortados al contenido (`balanced-logo-size.ts` iguala el área). Son 6 nuevos (Dolphin, Fresh Air, Nannis Amigurumis, PixelAndCode, Rock and Race y Target G) y se revisan los existentes. | Inline | ninguno | pendiente |
| T3 | S1 | Datos de los 14 patrocinadores en `INITIAL_SPONSORS` (`sponsors-seed.ts`), con el mismo formato: los mismos campos llenos y el mismo estilo de `services`. Como `seedSponsors` solo llena una tabla vacía, producción necesita una vía de carga (ver L5). Pruebas del seed y `CHANGELOG.md`. | Inline | item 1 si se escribe un backfill sobre datos guardados | pendiente |
| T4 | S2 | Arte de los juegos en `public/games/`: la tarjeta 810x1080 como `<slug>.jpg`, la portada 1920x1080 como `<slug>-portada.jpg` y las capturas 1920x1080 como `<slug>-captura-NN.jpg`, todo en JPG RGB y de máximo 5 MB. Incluye las conversiones de L4 y la actualización de `games-seed.ts` si cambian las capturas. | Inline | ninguno | pendiente |
| T5 | S2 | Arte que no viene en la carpeta: sombra-del-mictlan (no tiene ninguna imagen), make-em-fall (no tiene carpeta) y las capturas de 16 juegos. Se reporta a los equipos. | Reporte | ninguno | sin commit |

Rama `feature/<issue>-sponsors-and-game-art` desde `develop`. T2 y T3 van en un commit y T4 en otro. Sin push ni PR.

## Log

- **L1** (pedido original, verbatim): "'/Users/carlglzm/Downloads/GENERAL - PATROCINADORES' en el odd debemos agregar a
  los patrocinadores restantes, hay que hacer un scrapping para conseguir su informacion faltan en caso de que falte
  informacion, TODOS DEBEN QUEDAR UNIFORMES (LOS NEGOCIOS SON DE CANCUN /Users/carlglzm/Downloads/portadas tambien las
  portadas o arte que falta dentro de esta carpeta)."
- **L2** (evidencia: repositorio):
  - Modelo `Sponsor`: `prisma/schema.prisma:202-213`.
  - Validación: `sponsor-input.ts`. `name` va de 1 a 80 caracteres. `logoPath` debe estar en `public/` (svg, png,
    jpg o webp). `websiteUrl` es https. `phone` sigue `^\+\d{8,15}$`. `services` tiene hasta 200 caracteres.
    `position` va de 1 a 999.
  - Los logos no se suben: `saveSponsor` exige que el archivo exista en `public/` (`sponsor-mutations.ts:75-77`).
  - `seedSponsors` solo llena la tabla si está vacía (`sponsors-seed.ts:59-63`).
  - Ranuras de imagen de un juego: `game-image-slots.ts:15-50`.
  - El backfill de imágenes solo agrega las que faltan, no reemplaza (`game-image-backfill.ts`).
- **L3** (evidencia: carpeta de patrocinadores, 13 carpetas; datos de los `.docx`):

  | Patrocinador | En el repo | Datos de la carpeta | Falta (scraping) |
  |---|---|---|---|
  | Bonavida | sí | +52 998 304 8120; https://aguabonavida.com.mx/; logo PNG | email, services |
  | Directrix Studio | sí | directrixstudio@gmail.com; 998 126 8631 / 998 768 2460; Facebook; 6 logos PNG | services; sitio propio (si lo hay) |
  | Dolphin | **no** | solo un logo JPEG de WhatsApp (con fondo) | todo; nombre exacto del negocio |
  | Fresh Air | **no** | +52 998 180 2252; https://freshair.com.mx/; logo SVG | email, services |
  | Le Jardin d'Aurore | sí | contacto@lejardindaurore.com; logo SVG | services |
  | Mermelada | sí (solo logo) | mermeladacancun@gmail.com; 998 181 9937; 5 logos JPEG | web, services |
  | Nannis Amigurumis | **no** | solo un logo PNG sin fondo | todo |
  | Nemo Submarine | sí | +1 (903) 801 9083; https://www.nemoisla.com/; logo PNG | email, services; teléfono local |
  | Noxy Digital | sí | info@noxy.digital; +52 998 172 5547; https://www.noxy.digital/; logos | services. La carpeta `Ponente/` es de un ponente, no de un patrocinador ("FALTA NOMBRE") |
  | OpSET | sí | ceo@opset.com.mx; 998 187 8194; SVG y PNG. Trae una copia de Le Jardin d'Aurore | web, services |
  | PixelAndCode | **no** | solo un logo PNG | todo |
  | Rock and Race | **no** | solo un logo PNG | todo |
  | Target G | **no** | solo un logo PNG sin fondo | todo |
  | Algorix Insights | sí | no tiene carpeta | phone, email |

- **L4** (evidencia: carpeta de portadas, tamaños medidos con `sips`, todo en RGB):
  - Correspondencia: las 16 carpetas tienen su slug. Las `*-tarjeta` miden 810x1080 (la ranura de la tarjeta). Las
    `*-coverflow` miden 794x1080 y no corresponden a ninguna ranura. Las `*-portada` miden 1920x1080. Las capturas de
    one-mind (3) e identity-dissolution (7) miden 1920x1080.
  - Hay que convertir de PNG a JPG: turno-rosso, don-t-pet-me, echoscrap y reencarnacion-express.
  - Hay que renombrar: laboratorio-4 (`.jpg.jpeg`), saatan-paal (`sataan-paal-*`), dark-mutant (`.jpeg`) y
    reencarnacion-express ("exrpess" y "exrpress").
  - Excepciones:
    - La portada de dark-mutant mide 1600x900 y hay que escalarla a 1920x1080.
    - Vaporlock no trae tarjeta ni portada con el tamaño correcto. `JackVeil_Vertical.png` mide 1086x1448 y
      `Vaporlock_Portada (2).png` mide 1087x1447; los dos son 3:4 y se pueden redimensionar a 810x1080.
      `JackVeil_Horizontal.png` mide 1672x941 y se puede escalar a 1920x1080.
    - One-mind no tiene tarjeta, salvo `propuesta-recorte-vertical.png` (810x1080).
    - Don't pet me tiene `tarjeta.png` (810x1080) y `coverflow-conlogo.png` (1620x2160, el doble).
    - identity-dissolution trae 7 capturas, pero hay 4 ranuras.
- **L5** (para confirmar antes de implementar):
  - Cómo se cargan los patrocinadores en producción: con el formulario del panel (sin logo nuevo hasta el deploy, porque
    el logo vive en `public/`) o con un backfill que agregue los que faltan sin tocar los existentes.
  - El formato uniforme de `services`: una frase corta en español, por ejemplo "Agua purificada a domicilio en
    Cancún".
  - Si Algorix Insights sigue, porque no tiene carpeta.
  - Si se usa el teléfono +1 de Nemo Submarine o se busca uno local.
  - El orden (`position`) de los nuevos patrocinadores.
  - Arte:
    - Qué hacer con las `*-coverflow` de 794x1080: la app no las usa.
    - Si Don't pet me lleva la tarjeta con logo.
    - Qué archivos van en Vaporlock.
    - Si la tarjeta de One-mind es `propuesta-recorte-vertical.png`.
    - Cuáles 4 de las 7 capturas de identity-dissolution.
