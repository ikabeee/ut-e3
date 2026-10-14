/**
 * Textos de la interfaz de `teams`: portal de equipo, métricas, escáner, integrantes y ficha del juego.
 * Los que dependen de un dato dinámico son funciones puras.
 */
export const TEAMS_COPY = {
  page: {
    title: "Portal del Equipo",
    description: "Panel de administración y escáner de visitas para equipos del showcase.",
    loading: "Cargando portal...",
  },
  portal: {
    header: "Portal de Equipo",
    portalTeam: (name: string) => `Portal · ${name}`,
    stand: (code: string) => `Stand ${code}`,
    standUnassigned: "S/A",
    standPending: "Stand por asignar",
    ariaCloseMenu: "Cerrar menú",
    ariaOpenMenu: "Abrir menú de navegación",
    ariaNav: "Navegación del portal",
    logout: "Cerrar sesión",
  },
  sections: {
    overview: {
      label: "Resumen",
      description: "Métricas de visitas y afluencia en tiempo real de tu stand",
    },
    scanner: {
      label: "Escáner QR",
      description: "Escanea los códigos QR de los visitantes para registrar sus partidas",
    },
    members: {
      label: "Integrantes",
      description: "Gestiona a tus compañeros de equipo para la ficha pública",
    },
    game: {
      label: "Ficha del Juego",
      description: "Información, descripción y enlaces de tu videojuego en exhibición",
    },
  },
  overview: {
    totalVisitsTitle: "Total de Visitas Registradas",
    totalVisitsSubtitle: "Visitantes que han jugado la demo",
    trafficTitle: "Afluencia Actual (Últimos 15 min)",
    trafficSubtitle: "Refleja el flujo en tiempo real en el croquis",
    visitsCount: (count: number) => `${count} visitas`,
    gameInfoTitle: "Información del Juego",
    gamePendingTitle: "Videojuego por registrar",
    gamePendingDesc: "Registra la información de tu juego para que los visitantes puedan conocerlo.",
    openScanner: "Abrir Escáner QR",
    editGame: "Editar Ficha",
    manageMembers: (count: number) => `Gestionar Integrantes (${count})`,
  },
  gameManager: {
    title: "Ficha del Videojuego",
    infoTitle: "Información del Videojuego",
    description:
      "Edita la sinopsis y el enlace a la versión jugable que verán los visitantes en el catálogo del showcase.",
    emptyTitle: "Tu equipo aún no tiene un juego vinculado.",
    emptyDescription: "Consulta con el administrador del evento para asignarlo.",
    synopsisLabel: "Sinopsis / Descripción",
    synopsisPlaceholder: "Breve resumen de la premisa y mecánicas de tu juego...",
    itchioLabel: "Enlace a Itch.io (Opcional)",
    itchioPlaceholder: "https://tu-usuario.itch.io/tu-juego",
    saveButton: "Guardar ficha del juego",
    savingButton: "Guardando cambios...",
    successToast: "Ficha del videojuego actualizada exitosamente.",
  },
  memberManager: {
    title: "Integrantes del Equipo",
    description: "Registra a tus compañeros de equipo para que figuren en la ficha pública del juego.",
    emptyTitle: "Aún no hay integrantes registrados.",
    leaderBadge: "(Líder)",
    groupLabel: "Grupo",
    deleteButton: "Eliminar",
    deleteSuccessToast: "Integrante eliminado exitosamente.",
    deleteErrorFallback: "Error al eliminar integrante.",
    addTitle: "Agregar Nuevo Integrante",
    fullNameLabel: "Nombre Completo",
    fullNamePlaceholder: "ej. Juan Pablo Hernández",
    studentGroupLabel: "Grupo Estudiantil",
    saveButton: "Agregar integrante",
    savingButton: "Guardando...",
    addSuccessToast: "Integrante registrado exitosamente.",
  },
  scanner: {
    title: "Escáner de Visitantes",
    subtitle: "Escanea el código QR del pasaporte del visitante cuando juegue tu demo.",
    stopCamera: "Detener cámara",
    startCamera: "Activar cámara",
    cameraError: "No se pudo acceder a la cámara. Verifica los permisos del navegador.",
    alertSuccessTitle: "¡Visita registrada con éxito!",
    alertSuccessDescription: (gamertag?: string) =>
      gamertag ? `Se sumó la visita del visitante: @${gamertag}` : "Visita registrada correctamente en este juego.",
    alertDuplicateTitle: "Visita ya registrada previamente",
    alertDuplicateDescription: (gamertag?: string) =>
      gamertag
        ? `El visitante @${gamertag} ya había probado este juego.`
        : "Este código QR ya fue escaneado en este stand.",
    alertUnknownTitle: "Código QR no reconocido",
    alertUnknownDescription: "Verifica que el código corresponda a un pasaporte de visitante válido.",
    manualInputLabel: "Ingreso manual de código o URL",
    manualInputPlaceholder: "Pega la URL del QR o el token (ej. /v/... o 32 dígitos)",
    submitManual: "Registrar visita",
  },
} as const;
