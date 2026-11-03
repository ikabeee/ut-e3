export const SUPPORT_COPY = {
  recovery: {
    title: "Mesa de recuperación",
    description: "Entrega un acceso nuevo al pasaporte de un visitante que perdió su teléfono.",
    loading: "Cargando la mesa de recuperación…",
    signedInAs: (name: string) => `Sesión de ${name}`,
    form: {
      heading: "Confirma la identidad del visitante",
      hint: "Escribe su nombre completo y su gamertag tal como los registró. Recuperar cierra el acceso del teléfono anterior.",
      fullNameLabel: "Nombre completo",
      gamertagLabel: "Gamertag",
      submit: "Recuperar pasaporte",
      pending: "Recuperando…",
    },
    result: {
      heading: "Pasaporte recuperado",
      visitorLine: (fullName: string, gamertag: string) => `${fullName} · ${gamertag}`,
      registeredLine: (date: string) => `Registrado el ${date}`,
      linkLabel: "Enlace de acceso",
      instructions:
        "Pídele al visitante que abra este enlace en su teléfono. El teléfono anterior ya no tiene acceso. No lo mandes por chat: muéstralo en pantalla.",
      qrLabel: "Código QR para abrir el pasaporte",
      qrHint: "El visitante puede escanear este código con la cámara de su teléfono.",
      copyLink: { idle: "Copiar enlace", copied: "Enlace copiado", failed: "No se pudo copiar" },
      newRecovery: "Recuperar otro pasaporte",
    },
    errors: {
      fullNameRequired: "Escribe el nombre completo del visitante.",
      gamertagRequired: "Escribe el gamertag del visitante.",
      fieldTooLong: "Un dato es demasiado largo; revísalo.",
      // The same text whether the visitor exists or not, so the desk cannot be used to find out who registered.
      identityMismatch: "El nombre y el gamertag no coinciden con ningún pasaporte. Revísalos con el visitante.",
      agentLimit: "Hiciste demasiadas recuperaciones seguidas. Espera unos minutos.",
      visitorLimit: "Este pasaporte ya se recuperó 3 veces en la última hora. Intenta más tarde o avisa al sysadmin.",
    },
  },
} as const;
