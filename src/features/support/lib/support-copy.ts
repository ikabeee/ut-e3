export const SUPPORT_COPY = {
  recovery: {
    title: "Mesa de recuperación",
    description: "Entrega un acceso nuevo al pasaporte de un visitante que perdió su teléfono.",
    loading: "Cargando la mesa de recuperación…",
    signedInAs: (name: string) => `Sesión de ${name}`,
    form: {
      heading: "Busca el pasaporte del visitante",
      hint: "Escribe lo que el visitante recuerde: su correo, su gamertag o su nombre completo. Recuperar cierra el acceso del teléfono anterior.",
      queryLabel: "Correo, gamertag o nombre completo",
      submit: "Buscar pasaporte",
      pending: "Buscando…",
    },
    candidates: {
      heading: "Confirma que es el visitante correcto",
      hint: "Pídele su gamertag y cuántos stands ha visitado, y compáralos con lo que ves aquí antes de recuperar.",
      count: (total: number) => (total === 1 ? "1 pasaporte coincide" : `${total} pasaportes coinciden`),
      gamertag: (gamertag: string) => `Gamertag: ${gamertag}`,
      email: (email: string) => `Correo: ${email}`,
      registered: (date: string, time: string) => `Registrado el ${date} a las ${time}`,
      stands: (total: number) => (total === 1 ? "1 stand visitado" : `${total} stands visitados`),
      recover: "Recuperar este pasaporte",
      recovering: "Recuperando…",
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
      queryRequired: "Escribe el correo, el gamertag o el nombre completo del visitante.",
      targetRequired: "Elige el pasaporte que quieres recuperar.",
      fieldTooLong: "Un dato es demasiado largo; revísalo.",
      // The same text whether the data exists or not, so the desk cannot be used to find out who registered.
      notFound:
        "No hay ningún pasaporte con ese dato. Pregunta al visitante por otro: su correo, su gamertag o su nombre.",
      agentLimit: "Hiciste demasiadas recuperaciones seguidas. Espera unos minutos.",
      visitorLimit: "Este pasaporte ya se recuperó 3 veces en la última hora. Intenta más tarde o avisa al sysadmin.",
    },
  },
  register: {
    heading: "Registrar visitante",
    hint: "Para quien no se registró antes del evento. El correo es obligatorio y debe ser del visitante: ahí llega su PIN y es la forma de recuperar su pasaporte.",
    fullNameLabel: "Nombre completo",
    gamertagLabel: "Gamertag",
    emailLabel: "Correo",
    enrollLabel: "Inscribir también en el torneo de KOF",
    enrollHint: "Solo durante la inscripción presencial.",
    submit: "Registrar visitante",
    pending: "Registrando…",
    result: {
      heading: "Pasaporte creado",
      pinLabel: "PIN",
      pinHint: "El visitante lo dice en cada stand. También le llega por correo.",
      instructions:
        "Pídele al visitante que escanee el código o abra el enlace en su teléfono: ahí queda su pasaporte. No lo mandes por chat: muéstralo en pantalla.",
      newRegistration: "Registrar otro visitante",
      enrollment: {
        enrolled: "También quedó inscrito en el torneo de KOF.",
        notOnsite: "No se inscribió en el torneo: la inscripción presencial no está abierta.",
        refused: "No se pudo inscribir en el torneo (lista llena). Avisa al administrador de KOF.",
      },
    },
    errors: {
      invalid: "Revisa los datos marcados.",
      gamertagTaken: "Ese gamertag ya está registrado.",
      // The same text for a blocked, a used and a staff email, as in the public form.
      rejected: "No se pudo registrar este correo.",
      closed: "El registro todavía no abre.",
      agentLimit: "Registraste demasiados visitantes seguidos. Espera unos minutos.",
    },
  },
} as const;
