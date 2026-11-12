export const PWA_COPY = {
  offline: {
    title: "Sin conexión",
    description: "Tu teléfono no tiene señal. Aquí está lo último que se guardó.",
    reconnecting: {
      title: "Reconectando",
      checking: "Tenemos red. Comprobando que el servidor responda.",
      unreachable: "Tenemos red pero no llegamos al servidor, reintentando.",
    },
    retry: "Reintentar",
    retryPending: "Comprobando...",
    noCopyTitle: "Aún no hay una copia guardada",
    noCopy: "Esta página no se guardó en tu teléfono. Vuelve a intentarlo cuando tengas señal.",
    retrying: "Esperando señal: la página se actualiza sola al volver la conexión.",
    browseTitle: "Disponible sin conexión",
    games: "Catálogo de juegos",
    home: "Inicio y croquis",
  },
  connection: {
    label: "Estado de la conexión",
    online: "En línea",
    offline: "Sin conexión",
  },
  install: {
    button: "Instalar la app",
    hint: "Ábrela desde tu pantalla de inicio, aun sin señal.",
    iosTitle: "Instalar en iPhone",
    iosSteps: "Toca Compartir y elige Añadir a pantalla de inicio.",
  },
} as const;
