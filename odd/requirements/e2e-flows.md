# Flujos e2e

Flujos de punta a punta con Playwright. Cada flujo es un archivo `*.spec.ts` y cada paso con "Verifica" es un `expect`.

| Campo | Valor |
| --- | --- |
| Fuentes | `odd/requirements/srs-v2.md`, artifacts de arquitectura y modelo ER, `odd/requirements/unit-test-cases.md` |
| Herramienta | Playwright (`@playwright/test`), dependencia nueva de desarrollo |
| Guía | `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md` |
| Ubicación propuesta | `e2e/` en la raíz, fuera de `src/` (Jest solo corre `src/`) |

## Entorno de las pruebas

- **Contra el build de producción:** la guía de Next.js recomienda "running your tests against your production code".
  Se corre `npm run build` y `npm run start` (o el `webServer` de Playwright) con la misma imagen de Docker.
- **BD limpia por ejecución:** un archivo SQLite nuevo en un directorio de `mktemp -d`, con migraciones y un seed de
  prueba (18 stands, cuentas de cada rol, juegos y horarios).
- **Correo capturado:** un servidor SMTP de prueba (por ejemplo, Mailpit en Docker Compose) recibe los correos de la
  bandeja de salida; la prueba lee de ahí los enlaces de recuperación e invitación.
- **PIN en el kiosco:** desde la v2.2 no hay QR ni cámara. Los flujos teclean el PIN del visitante en la computadora
  del stand (vista tipo kiosco); el seed fija los PIN de los visitantes de prueba y los flujos de registro leen el PIN
  del pasaporte.
- **Horarios relativos a la hora real:** los cortes viven en `event_settings`, así que cada prueba fija los horarios
  alrededor de la hora actual (por ejemplo, el corte de check-ins dentro de 5 s y la rifa dentro de 10 s) y espera a
  que pasen. Lo mismo vale para KOF: el check-in, la inscripción presencial y la generación del bracket se fijan unos
  segundos después de la hora real. No hay reloj falso ni endpoints de prueba en el build de producción. En los flujos,
  "a las 17:00" significa "después del corte configurado para la prueba", y "a las 12:00" (fin del check-in de KOF) o
  "a las 13:00" (bracket), lo mismo con su valor de `event_settings`.
- **Dispositivos (proyectos de Playwright):** iPhone con WebKit a 390 px, Android con Chromium a 360 px y escritorio a
  1440 px. Los flujos de staff corren en el tamaño del dispositivo que usarán.
- **Varios actores:** cada actor es un `browserContext` propio (cookies y almacenamiento separados), para simular, por
  ejemplo, al staff y al visitante en el mismo flujo.

---

## Visitante

### E2E-01. Registro y copia del pasaporte
**Actores:** visitante (iPhone). **Req:** RF-12, RF-13, RF-14, RF-16, RF-17, RF-19.

1. Abre `/passport` antes del 13 de noviembre. Verifica "El registro abre el 13 de noviembre".
2. Con la hora en el 13 de noviembre, llena nombre completo, gamertag y correo. Verifica el aviso de privacidad visible.
3. Envía. Verifica el pasaporte con su PIN de 5 dígitos y su gamertag, sin código QR.
4. Verifica en el SMTP de prueba un correo con el mismo PIN, el gamertag y el enlace a `/passport`, sin enlace de recuperación.
5. Recarga la página. Verifica que sigue en su pasaporte (cookie del dispositivo).

### E2E-02. Registro bloqueado por la lista negra
**Actores:** visitante. **Req:** RF-15.

1. Intenta registrarse con el correo de un integrante de un equipo.
2. Verifica "No se pudo registrar este correo" y que no se creó pasaporte ni se encoló correo.

### E2E-03. Recuperación por correo
**Actores:** visitante en el teléfono A, el mismo visitante en el teléfono B. **Req:** RF-68, RF-70, RF-71.

1. En B abre "Recuperar mi pasaporte" y escribe su correo. Verifica el mensaje genérico.
2. Abre en B el enlace del correo capturado. Verifica su pasaporte en B.
3. En A recarga. Verifica que A perdió el acceso.
4. Abre otra vez el mismo enlace. Verifica que ya no sirve.

### E2E-04. Recuperación en la mesa de atención
**Actores:** agente de atención (escritorio), visitante (teléfono nuevo). **Req:** RF-69, RF-70.

1. El agente busca al visitante y confirma nombre completo y gamertag.
2. Genera el enlace. Verifica que aparece y que la acción quedó en la bitácora.
3. El visitante lo abre. Verifica su pasaporte en el teléfono nuevo.

---

## Stand

### E2E-05. Alta de un stand y su equipo
**Actores:** sysadmin, administrador de stand, staff. **Req:** RF-31, RF-32, RF-39, RF-40.

1. El sysadmin crea el stand `zA-s3-e5-103` con su administrador. Verifica el correo de invitación.
2. El administrador abre la invitación, define su contraseña y registra su juego con imágenes.
3. Crea 3 cuentas de staff. Verifica que la cuarta se rechaza.
4. Un staff activa su cuenta e inicia sesión. Verifica que solo ve el kiosco de visitas de `zA-s3`.

### E2E-06. Visita con PIN y encuesta en línea
**Actores:** kiosco de `zA-s3` (escritorio, sesión del staff), visitante (iPhone). **Req:** RF-26 a RF-30, RF-36, EC-03.

1. Al terminar de jugar, el visitante teclea su PIN en la pantalla del PIN del kiosco.
2. Verifica la vista kiosco: "zA-s3 · Nombre del juego" y tres escalas de 1 a 5 (juego, stand y arte), sin datos del staff.
3. Verifica que no se puede enviar con alguna escala sin contestar. El visitante califica y envía. Verifica "Gracias" y el regreso solo a la pantalla del PIN.
4. Verifica que el panel del staff muestra "Visita registrada" y nunca las calificaciones.
5. En el pasaporte del visitante verifica `zA-s3` como visitado y el avance.
6. Se teclea otra vez el mismo PIN en el kiosco. Verifica que no se duplica la visita ni se guarda otra encuesta.

### E2E-07. Visita sin conexión
**Actores:** kiosco del stand (escritorio, sesión del staff), visitante. **Req:** D4, RN-04, RF-35.

1. Pone el kiosco sin conexión (`context.setOffline(true)`). Registra 3 visitas tecleando 3 PIN y contestando la encuesta.
2. Verifica "Sin conexión · 3 visitas por enviar".
3. Recupera la conexión. Verifica "Enviando..." y después "Todo enviado".
4. Verifica las 3 visitas en los pasaportes.
5. Registra una visita sin conexión a las 16:59 y reconecta después de las 18:00. Verifica que aparece en "No registradas" con el motivo y que el pasaporte del visitante muestra el aviso.

### E2E-08. Boletos por hitos
**Actores:** kioscos de varios stands, visitante. **Req:** RN-01, RF-21, RF-22.

1. Con un visitante que ya tiene 8 visitas (seed), registra la novena.
2. Verifica en el pasaporte el boleto con su número y la barra de progreso hacia 18.
3. Con 17 visitas, registra la decimoctava. Verifica el segundo boleto.

### E2E-18. PIN no reconocido en el kiosco
**Actores:** kiosco de `zA-s3` (escritorio, sesión del staff), visitante. **Req:** RF-24, RF-35, EC-04.

1. El visitante teclea un PIN que no es de nadie (mal tecleado) y contesta la encuesta. Cuando la visita llega al servidor, verifica que aparece en la lista de rechazadas del kiosco con su motivo y que no identifica a ningún visitante.
2. Verifica que no se creó ningún check-in ni voto y que ningún pasaporte cambió.
3. Teclea el PIN de otro visitante real como si fuera el suyo. Verifica que se acepta (riesgo aceptado) y que la visita aparece en el pasaporte de ese visitante, que puede reportarla en Atención.

---

## Rifa

### E2E-09. Tómbola en vivo
**Actores:** animador (escritorio), pantalla `/raffle/live`, otro administrador de rifa, visitante ganador. **Req:** RF-49 a RF-56.

1. Antes de las 18:00 el animador intenta girar. Verifica el rechazo.
2. A las 18:00 gira. Verifica que la pantalla muestra el boleto y el gamertag por SSE sin recargar.
3. Verifica que "Girar" está deshabilitado mientras el modal pide "Ganador" o "Descartado".
4. Elige "Descartado". Verifica que no se envió correo y que se puede girar de nuevo.
5. Gira y elige "Ganador". Verifica el correo al ganador, "Ganaste" en su pasaporte y su gamertag en la sección pública de ganadores.
6. El otro administrador registra el premio. Verifica el premio en el pasaporte y en la sección pública.
7. Verifica que los boletos del visitante que ya salió no vuelven a salir.

---

## Torneo KOF

### E2E-10. Lista previa y check-in de KOF
**Actores:** administrador de KOF (escritorio), staff de KOF, visitantes (iPhone). **Req:** RF-58, RF-75, RF-14.

1. Con la apertura de la inscripción previa unos segundos adelante, el administrador intenta agregar a un visitante con pasaporte. Verifica el rechazo. Cuando la apertura pasa, agrega a tres visitantes con pasaporte. Verifica que aparecen en la lista previa sin check-in.
2. Un staff de KOF abre la lista. Verifica que no puede agregar jugadores ni hacer el check-in.
3. Con la lista previa en 50 jugadores (seed), el administrador intenta agregar al 51. Verifica el rechazo por el cupo de 50.
4. En el pasaporte de un inscrito verifica que indica que está en el torneo y el aviso de check-in con las horas de `event_settings` (el 20 de noviembre, de 11:00 a 12:00, en el stand de KOF del edificio B).
5. Antes de que abra el check-in, el administrador teclea el PIN de un inscrito. Verifica el rechazo.
6. Dentro de la ventana de check-in, teclea el PIN de dos inscritos. Verifica que cada uno queda con check-in. Teclea un PIN que no está en la lista previa y otro que no es de nadie. Verifica el rechazo de los dos y que no se creó ninguna inscripción.

### E2E-16. "No se presentó" e inscripción presencial de KOF
**Actores:** administrador de KOF (escritorio), visitantes (iPhone), visitante sin pasaporte. **Req:** RF-76, RF-77, RF-58, EC-05, EC-15.

1. Con la lista previa del flujo E2E-10 (dos con check-in y uno sin él), espera a que pase el fin del check-in configurado. Verifica que el inscrito sin check-in queda en "No se presentó" y que los otros dos siguen con check-in.
2. El administrador teclea el PIN del inscrito en "No se presentó" (EC-15). Verifica el rechazo y que su estado no cambia.
3. Dentro de la inscripción presencial, el administrador agrega a un visitante con pasaporte. Verifica que queda inscrito con el check-in ya hecho.
4. Un visitante sin pasaporte se registra (E2E-01) y el administrador lo agrega. Verifica su PIN en el pasaporte y su check-in hecho.
5. Con el seed ajustado para que, con los pasos 3 y 4, queden 63 inscripciones vigentes más la de "No se presentó", dos visitantes intentan inscribirse uno tras otro. Verifica que el primero entra (el lugar liberado se ocupa) y que el segundo ve "Torneo lleno".
6. Cuando cierra la inscripción presencial, el administrador intenta inscribir a alguien. Verifica el rechazo.

### E2E-17. Generación del bracket de KOF
**Actores:** administrador de KOF (escritorio), staff de KOF. **Req:** RF-59, RF-60, RF-57, EC-06.

1. Con 40 jugadores con check-in y 5 en "No se presentó" (seed), el administrador intenta generar el bracket antes de la hora configurada. Verifica el rechazo.
2. Después de la hora configurada, genera el bracket. Verifica 63 combates, que solo están los 40 jugadores con check-in, que los 24 lugares vacíos son byes repartidos parejo entre los 4 tableros y que ningún bye se enfrenta a otro.
3. Un segundo intento (otro administrador o el mismo) muestra "El bracket ya se generó".

### E2E-11. Bracket en vivo
**Actores:** staff del tablero 1, administrador de KOF, público (3 teléfonos). **Req:** RF-61 a RF-67, D2.

1. El público abre `/tournament`. Verifica el bracket.
2. El staff activa un combate y marca al perdedor. Verifica que en los 3 teléfonos el ganador aparece en el siguiente combate sin recargar.
3. El staff intenta capturar un combate del tablero 2. Verifica el rechazo.
4. El staff y el administrador guardan el mismo combate a la vez. Verifica que uno ve "El combate cambió, recarga".
5. El administrador congela un combate y descalifica a los dos. Verifica el bye en el siguiente combate.
6. El staff marca "No se presentó" y el administrador lo revierte antes del siguiente combate. Verifica el estado restaurado.

### E2E-12. Cierre del bracket público
**Actores:** sysadmin, staff de KOF, público. **Req:** Ops, D2.

1. El sysadmin toca "Cerrar al público".
2. Verifica que el público ve "El bracket está disponible en la pantalla del torneo".
3. Verifica que el staff sigue viendo y capturando su tablero.

---

## Sysadmin y contenido

### E2E-13. Cronograma y horarios
**Actores:** sysadmin, visitante. **Req:** RF-03, RF-42, RF-43, RF-10, RF-75, RF-76.

1. Sin actividades, verifica "Cronograma por anunciar" en la landing.
2. El sysadmin crea una actividad. Verifica que la landing la muestra sin deploy.
3. A las 16:29 verifica que la ficha del juego muestra la hora de activación sin enlace; a las 16:30, el enlace.
4. El sysadmin cambia en `event_settings` la ventana de check-in de KOF. Verifica que el aviso del pasaporte de un inscrito muestra las horas nuevas y que el cierre de "No se presentó" ocurre a la hora nueva.

### E2E-14. Moderación
**Actores:** sysadmin, visitante. **Req:** RF-45, RF-46.

1. Con un visitante de 9 visitas y su boleto, el sysadmin anula una visita con motivo.
2. Verifica que el pasaporte muestra 8 visitas y el boleto anulado.
3. El sysadmin excluye a otro visitante. Verifica que sus boletos no salen en la tómbola.

---

## Móvil primero

### E2E-15. Revisión de pantallas
**Actores:** visitante y staff en 360 px, 390 px, horizontal y 1440 px. **Req:** RNF-12, `AGENTS.md`.

1. En la landing, `/games`, `/floor-plan`, `/passport`, `/tournament` y el kiosco de visitas verifica `document.documentElement.scrollWidth <= innerWidth`.
2. Verifica que los controles principales (navegación, teclado del PIN, botones de la encuesta, "Girar") miden al menos 44x44 px.
3. Verifica que los campos de texto miden al menos 16 px de fuente.

---

## Decisiones

- Herramienta: Playwright, contra el build de producción.
- Hora del servidor: horarios relativos a la hora real en `event_settings`; sin reloj falso en producción.
- PIN en lugar de QR (v2.2): los flujos de visita teclean el PIN en el kiosco del stand; la computadora del kiosco es de
  escritorio (RF-26).
- Temas abiertos que los flujos no asumen (sección 9 de la SRS): cómo se guarda el PIN, qué pasa con un PIN mal
  tecleado sin conexión que coincide con el de otro visitante y cómo pide el visitante entrar a la lista previa de KOF.
