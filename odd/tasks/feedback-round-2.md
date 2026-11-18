Segunda ronda de cambios pedidos por el usuario (28 puntos más un video).
Entrega en varias ramas por área (decisión L2). El punto 25 se descarta: se queda el enlace de invitación (L2).
Correo de prueba: carlglz30@gmail.com.

## Specs

- S1: "Necesito un template para los correos de confirmacion acorde a la estetica de la pagina"
- S2: "2FA para aquellos que tengan acceso al panel de admnisitrador" — código de 6 dígitos por correo (L2).
- S3: "En el navbar se va a llamar KOF en lugar de tabla de posiciones"
- S4: "Necesito graficos para la informacion del servidor"
- S5: "En rifa colocaras "La rifa empieza y pones la fecha de la rifa mas la hora"
- S6: "Los loading states tienen que ser spinners"
- S7: "Los mensajes de error TODOS DEBEN SER A TRAVES DE TOAST"
- S8: "Al momento de inscribir al torneo de KOF" — enviar correo de confirmación con el template de S1 (L2).
- S9: "En el login la contrasena debe haber un icono que nos permita ver la contrasena"
- S10: "vas actualizar las portadas y las galerias de los juegos a partir de aqui https://drive.google.com/drive/folders/1ZsImnvoS70XPs6qN1ERIHSv1_uTqbvK2"
- S11: "En el panel de admin colocaras el layout igual en la pantalla de kof nos debe ayudar a poder monitorear todo en tiempo real sobre el torneo de KOF"
- S12: "En el panel de admin (de cualquier rol) los loading states seran a traves de skeletons"
- S13: "Quita este copy "El bracket está disponible en la pantalla del torneo." a este copy El bracket estará disponible en la pantalla del torneo." Ademas agregle un icono u asset nos permita visualizar la espera"
- S14: "Dentro de croquis quita "PIXEL & CODE · Edificio B, UT Cancún""
- S15: "El juego de "Saatan Paal" debe ser Saatal Paal"
- S16: "A los administradores de cada stand debes permitirles subir la galeria pero CON BASE A LO QUE SE MANDO DEL GRID https://github.com/ikabeee/utg-cover-grid y debe poder coincidir con todo que hace que se expongan los juegos ademas que SOLO DEBE PERMITIR LAS IMAGENES QUE PIDE EL GRID, hay que hacer validaciones"
- S17: "Agregar Olvide mi contrasena en el login de administracion"
- S18: "Debemos mejorar la visualizacion del layout en mi pasaporte [Image#1] - debe ser mobile first" — boceto: navbar arriba; a la izquierda "PASAPORTE"; a la derecha un panel con "MAPA(CROQUIS)" y "DETALLE DEL JUEGO".
- S19: "Debes arreglar todos estos warnings" — `Warning: Failed to find font override values for font `LINE Seed JP` Skipping generating a fallback font.`
- S20: "Si algo llegase a suceder mal en el servidor, la aplicacion, etc debe enviarme correo a carlglz30@gmail.com (PARA EMERGENCIAS DE PRODUCCION) la env se llamara EMERGENCY_MAIL"
- S21: "En el search bar sigue sin aparecerme los juegos alhacer una busqueda [Image#2]" — al escribir "san" no aparece ningún resultado.
- S22: "Run `next upgrade --agent=security` and follow its instructions. para actualizar a una version segura"
- S23: "El copy de Invitadas especiales ddebe ser Invitados especiales"
- S24: "En el cronograma [Image#3] no debe aparecer el link para redireccionar solamente el lugar" — el lugar ("ARENA KOF", "ESCENARIO PRINCIPAL") se muestra sin la flecha ni el enlace.
- S25: descartado (L2): se queda el enlace de invitación.
- S26: "Tanto el sysadmin como los administadores de KOF deben poder ver la lista de participantes del torneo"
- S27: "LOS ADMINISTRADORES DE STAND QUE LE PERTENEZCA UN JUEGO DEBEN PODER MODIFCAR LOS DATOS DE SU JUEGO (CRUD)"
- S28: "[Image#4] Aqui debe aparecer igual un asset que indique que no hay ganadores aun" — junto a "Todavía no hay ganadores confirmados."
- S29: "AL FINALIZAR DEJARAS EN MI ESCRIOTRIO UN VIDEO SOBRE TODOS LOS FLUJOS INTERACTUANDO CON LA BASE DE DATOS REAL QUE HAY EN LOCAL, TAMBIEN SIMULARAS ESCENARIOS CATASTROFICOS QUE PUDIERAN SUCEDER EN PRODUCCION"

## Tasks

- [x] T1 S3 S5 S9 S13 S14 S15 S23 S24 S28 — copys y detalles de UI pública. inline. rama `fix/feedback-round-2-copy`
- [x] T2 S19 S21 — warnings de la fuente y búsqueda de juegos. inline. misma rama que T1
- [x] T3 S6 S7 S12 — spinners, toasts de error y skeletons del panel. rama `feature/feedback-round-2-feedback-states`
- [x] T4 S1 S8 S20 — template de correo, correo de inscripción a KOF y correo de emergencia. rama `feature/feedback-round-2-emails`
- [x] T5 S2 S17 — 2FA por correo y "Olvidé mi contraseña" del staff. Riesgo: item 2. rama `feature/feedback-round-2-staff-auth`
- [x] T6 S4 S11 S26 — gráficos del servidor, monitor del KOF en tiempo real y lista de participantes. rama `feature/feedback-round-2-admin`
- [x] T7 S16 S27 — galería con las reglas del grid y CRUD del juego del stand. Riesgo: item 1. rama `feature/feedback-round-2-stand-games`
- [x] T8 S10 — portadas y galerías desde Drive. rama `feature/feedback-round-2-stand-games`
- [x] T9 S18 — layout del pasaporte, mobile first. rama `feature/feedback-round-2-passport`
- [x] T10 S22 — actualización de seguridad de Next. Riesgo: item 5. rama `chore/feedback-round-2-next-security`
- [x] T11 S29 — video de los flujos y escenarios catastróficos en el escritorio.

- Entrega: T4 PR #169, T9 PR #170, T7 PR #171, T6 PR #172, T5 PR #173 (+ arreglo PR #178), T1/T2 PR #174, T10 PR #175, T3 PR #176, T8 PR #177. Video: ~/Desktop/ut-e3-flujos-y-catastrofes.mp4.

## Log

- L1 (petición original, textual):
  Ahora haras lo siguiente:
  1. Necesito un template para los correos de confirmacion acorde a la estetica de la pagina
  2. 2FA para aquellos que tengan acceso al panel de admnisitrador
  3. En el navbar se va a llamar KOF en lugar de tabla de posiciones
  4. Necesito graficos para la informacion del servidor
  5. En rifa colocaras "La rifa empieza y pones la fecha de la rifa mas la hora
  6. Los loading states tienen que ser spinners
  7. Los mensajes de error TODOS DEBEN SER A TRAVES DE TOAST
  8. Al momento de inscribir al torneo de KOF
  9. En el login la contrasena debe haber un icono que nos permita ver la contrasena
  10. vas actualizar las portadas y las galerias de los juegos a partir de aqui https://drive.google.com/drive/folders/1ZsImnvoS70XPs6qN1ERIHSv1_uTqbvK2
  11. En el panel de admin colocaras el layout igual en la pantalla de kof nos debe ayudar a poder monitorear todo en tiempo real sobre el torneo de KOF
  12. En el panel de admin (de cualquier rol) los loading states seran a traves de skeletons
  13. Quita este copy "El bracket está disponible en la pantalla del torneo." a este copy El bracket estará disponible en la pantalla del torneo." Ademas agregle un icono u asset nos permita visualizar la espera
  14. Dentro de croquis quita "PIXEL & CODE · Edificio B, UT Cancún"
  15. El juego de "Saatan Paal" debe ser Saatal Paal
  16. A los administradores de cada stand debes permitirles subir la galeria pero CON BASE A LO QUE SE MANDO DEL GRID https://github.com/ikabeee/utg-cover-grid y debe poder coincidir con todo que hace que se expongan los juegos ademas que SOLO DEBE PERMITIR LAS IMAGENES QUE PIDE EL GRID, hay que hacer validaciones
  17. Agregar Olvide mi contrasena en el login de administracion
  18. Debemos mejorar la visualizacion del layout en mi pasaporte [Image#1] - debe ser mobile first
  19. Debes arreglar todos estos warnings iled to find font override values for font `LINE Seed JP` Skipping generating a fallback font. (log de `next dev` repetido)
  20. Si algo llegase a suceder mal en el servidor, la aplicacion, etc debe enviarme correo a carlglz30@gmail.com (PARA EMERGENCIAS DE PRODUCCION) la env se llamara EMERGENCY_MAIL
  21. En el search bar sigue sin aparecerme los juegos alhacer una busqueda [Image#2]
  22. Run `next upgrade --agent=security` and follow its instructions. para actualizar a una version segura
  23. El copy de Invitadas especiales ddebe ser Invitados especiales
  24. En el cronograma [Image#3] no debe aparecer el link para redireccionar solamente el lugar
  25. Invitar al panel de administracion dependiendo el rol debe enviar una contrasena temporal POR CORREO y al momento que ingresa por primera vez debe poder cambiarla
  26. Tanto el sysadmin como los administadores de KOF deben poder ver la lista de participantes del torneo
  27. LOS ADMINISTRADORES DE STAND QUE LE PERTENEZCA UN JUEGO DEBEN PODER MODIFCAR LOS DATOS DE SU JUEGO (CRUD)
  28. [Image#4] Aqui debe aparecer igual un asset que indique que no hay ganadores aun
  AL FINALIZAR DEJARAS EN MI ESCRIOTRIO UN VIDEO SOBRE TODOS LOS FLUJOS INTERACTUANDO CON LA BASE DE DATOS REAL QUE HAY EN LOCAL, TAMBIEN SIMULARAS ESCENARIOS CATASTROFICOS QUE PUDIERAN SUCEDER EN PRODUCCION
  Cualquier correo de prueba es a carlglz30@gmail.com
- L2 (respuestas del usuario): punto 8 -> "Enviar correo de confirmación"; 2FA -> "Código de 6 dígitos por correo"; punto 25 -> "Se queda el enlance, no me acordaba"; entrega -> "Varias ramas por área (recomendado)".
- L3 (usuario): "Ademas para cosas de diseno/ui/ux usa opus 5.5 en medio y lo que tenga que ver con logica hazlo con gemini 3.8 flash high y sonnet 5.5 en medio". Gemini no está disponible: la lógica va con Sonnet 5.5 medio (agente logic-worker) y la UI con Opus 5.5 medio (agente ui-worker). Video autorizado en ~/Desktop; worktrees en ../ut-e3-worktrees/.
- L4 (usuario): "Al finalizar CADA RAMA lanza PR, mergeas y limpias ramas locales y worktrees". Primer lanzamiento de workers falló por error de red; reintento por "continua".
- L5 (usuario): "NO ME PREGUNTES NADA, IRE A DORMIR". Decisiones tomadas sin preguntar: S21 = sugerencias en vivo más búsqueda tolerante; S15 se aplica a las bases existentes con una migración; para S10 la tarjeta de One Mind sale de propuesta-recorte-vertical.png.
- L6: al grabar el video contra `next start` apareció un fallo en /reset-password/[token]: se pasaban funciones a un Client Component. Lo corrige el PR #178, verificado con build y start reales.
