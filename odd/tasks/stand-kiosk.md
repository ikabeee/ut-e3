# Kiosko del stand (M5 + M6)

Estado: implementado en `feature/stand-kiosk`, pendiente de revisión.

## Alcance

- Ruta protegida `/stand/kiosk` solo para `stand_admin` y `stand_staff` con stand asignado (RF-33).
- Flujo: el staff escribe el PIN → se crea una visita pendiente (`pending_visits`, 3 min) → el pasaporte del visitante
  (polling cada 3 s a `/api/visits/pending`) abre la encuesta (juego, stand, arte; 1 a 5) → al enviarla se registra la
  visita → el kiosko (polling cada 2 s a `/api/stand/visit-status`) muestra gracias (4 s) y vuelve al PIN (RF-26, RF-30).
- Respaldo sin señal: "Calificar en esta pantalla" abre la misma encuesta en el kiosko y registra con el PIN.
- Visita + voto + boletos de hito (9 y 18) en una sola transacción (RF-28, RF-22/23).
- Un check-in por pasaporte y stand (RF-23); el stand necesita juego registrado (RF-34); `scannedById` (RF-36).
- Corte de visitas en `checkInCutoffAt` (RN-04).
- El staff nunca ve las calificaciones (RF-29). Límite de 100 intentos de PIN por cuenta cada 5 minutos.

## Fuera de alcance (siguientes tareas)

- Alta de stands y cuentas desde el sysadmin (RF-31/32/39), registro del juego por el stand_admin.
- Cola sin conexión (RF-35) y filtro de PIN (RF-78).

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands`.
2. Entrar como `staff-za-s1@ejemplo.com` (contraseña de ejemplo del seed) → `/stand/kiosk`.
3. Para el lado del visitante: registra un pasaporte en `/register` (o usa uno de prueba) y ábrelo en `/passport`;
   el PIN de ese pasaporte es el que escribe el staff. Los pasaportes del seed (10001 a 10024) no tienen dispositivo,
   así que para ellos usa "Calificar en esta pantalla".
4. PIN `10001` lleva 8 visitas: su visita a ZA-S1 da el primer boleto.
