export const ACCOUNTS_COPY = {
  signIn: {
    title: "Iniciar sesión",
    description: "Acceso del staff y de los administradores del evento.",
    emailLabel: "Correo",
    credentialLabel: "Contraseña",
    submit: "Entrar",
    pending: "Entrando...",
    forgotPassword: "Olvidé mi contraseña",
    errors: {
      missingFields: "Escribe tu correo y tu contraseña.",
      invalidCredentials: "Correo o contraseña incorrectos",
    },
  },
  verifyCode: {
    title: "Verifica tu identidad",
    loading: "Cargando la verificación...",
    description: "Te enviamos un código de 6 dígitos a tu correo. Vence en 10 minutos.",
    codeLabel: "Código de 6 dígitos",
    submit: "Verificar",
    pending: "Verificando...",
    resend: "Reenviar código",
    resent: "Te enviamos un código nuevo.",
    backToLogin: "Volver a iniciar sesión",
    errors: {
      invalidFormat: "Escribe los 6 dígitos del código.",
      invalidCode: "El código es incorrecto o venció. Pide uno nuevo.",
      expiredChallenge: "Este intento de inicio de sesión venció. Vuelve a iniciar sesión.",
    },
  },
  loginCodeEmail: {
    subject: "Tu código para entrar al panel del evento",
    body: (name: string, code: string) =>
      `Hola, ${name}.

Tu código para entrar al panel del evento es: ${code}

Vence en 10 minutos y solo sirve una vez. Si no intentaste entrar, ignora este correo y cambia tu contraseña.`,
  },
  forgotPassword: {
    title: "Recupera tu contraseña",
    description: "Escribe el correo de tu cuenta del staff y te enviaremos un enlace para elegir una contraseña nueva.",
    emailLabel: "Correo",
    submit: "Enviar enlace",
    pending: "Enviando...",
    sent: "Si el correo pertenece a una cuenta activa, te enviamos un enlace que vence en 1 hora.",
    backToLogin: "Volver a iniciar sesión",
    errors: { emailInvalid: "Escribe un correo válido." },
  },
  resetPassword: {
    title: "Elige una contraseña nueva",
    loading: "Revisando el enlace...",
    greeting: (name: string) => `Hola, ${name}. Elige una contraseña nueva; se cerrarán tus sesiones abiertas.`,
    passwordLabel: "Contraseña nueva",
    confirmationLabel: "Repite la contraseña",
    hint: (minimum: number) => `Mínimo ${minimum} caracteres.`,
    submit: "Cambiar contraseña",
    pending: "Cambiando...",
    goToLogin: "Ir a iniciar sesión",
    requestAnother: "Pedir otro enlace",
    errors: {
      tooShort: (minimum: number) => `La contraseña necesita al menos ${minimum} caracteres.`,
      mismatch: "Las contraseñas no coinciden.",
      invalid: "Este enlace no es válido o ya se usó. Pide otro desde el inicio de sesión.",
      expired: "Este enlace venció. Pide otro desde el inicio de sesión.",
    },
  },
  passwordResetEmail: {
    subject: "Cambia tu contraseña del panel del evento",
    body: (name: string, link: string) =>
      `Hola, ${name}.

Pediste cambiar tu contraseña del panel del evento. Elige una nueva con este enlace antes de que pase 1 hora:
${link}

Si no lo pediste, ignora este correo: tu contraseña no cambia.`,
  },
  signOut: "Cerrar sesión",
  // The link of an account with two roles to its other area (S1).
  areas: {
    navLabel: "Cambiar de área",
    toStand: "Ir a mi stand",
    toRole: {
      help_desk: "Ir al centro de atención",
      kof_admin: "Ir al torneo de KOF",
      raffle_admin: "Ir a la rifa",
      sysadmin: "Ir al panel de administración",
    },
  },
  // The page of the role in the event (S4): what each role does, where, with which screens and who to ask. The hours of the
  // event are not here: the page shows the schedule from its single owner (EVENT_SCHEDULE of the schedule feature).
  myRole: {
    title: "Mi rol en el evento",
    description: "Qué haces durante el evento, a qué pantallas entras y a quién acudir.",
    loading: "Cargando tu rol...",
    signedInAs: (name: string) => `Sesión de ${name}`,
    link: "Mi rol",
    intro: "Esto es lo que te toca en el evento. Vuelve aquí cuando quieras con el enlace Mi rol del encabezado.",
    dualNote:
      "Tu cuenta tiene dos roles. Cada uno tiene su sección y entras a las pantallas de los dos con la misma sesión.",
    empty: "Tu cuenta no tiene un rol del evento todavía. Pregunta al sysadmin.",
    scheduleHeading: "Horario del evento",
    sections: {
      steps: "Qué haces durante el evento",
      placement: "Dónde estás",
      screens: "Tus pantallas",
      contact: "A quién acudir",
    },
    screens: {
      panel: "Panel de administración",
      kiosk: "Kiosko del stand",
      game: "Datos de mi juego",
      team: "Mi equipo",
      kof: "Torneo de KOF",
      raffle: "Rifa",
      recovery: "Mesa de recuperación",
    },
    placement: {
      stand: (code: string, gameName: string | null) =>
        gameName ? `Stand ${code}, con el juego ${gameName}.` : `Stand ${code}.`,
      desk: (desk: number) => `Mesa ${desk} del torneo: capturas el tablero ${desk}.`,
      deskPending: "Todavía no tienes una mesa asignada.",
      areas: {
        sysadmin: "Todo el evento, desde el panel de administración.",
        kof_admin: "El torneo de KOF: todas las mesas, las semifinales y la final.",
        raffle_admin: "La rifa final, en el escenario.",
        help_desk: "La mesa de recuperación de pasaportes.",
      },
    },
    contact: {
      sysadmin: "Si algo falla o tienes dudas, acude al sysadmin.",
      self: "Eres el sysadmin: el resto del equipo acude a ti.",
      standAdmin: (name: string) => `Si algo falla o tienes dudas, acude a ${name}, administrador de tu stand.`,
    },
    roles: {
      sysadmin: {
        summary: "Coordinas el sistema del evento y puedes entrar a todas las áreas.",
        steps: [
          "Abre el panel de administración y revisa el estado del servidor antes de que empiece el evento.",
          "Atiende las alertas de fraude y anula las visitas que no sean válidas.",
          "Da de alta al staff y reenvía invitaciones desde Cuentas.",
          "Si falta alguien, cubres el torneo, la rifa o la mesa de recuperación con tu misma cuenta.",
        ],
      },
      stand_admin: {
        summary: "Diriges el stand de tu juego y a tu staff.",
        steps: [
          "Abre el kiosko de tu stand y deja la pantalla lista para los visitantes.",
          "Cuando llega un visitante, pídele su PIN y escríbelo en el kiosko para registrar su visita.",
          "Mantén al día los datos y las imágenes de tu juego en Datos de mi juego.",
          "Invita y administra a tu staff desde Mi equipo.",
        ],
      },
      stand_staff: {
        summary: "Apoyas a registrar las visitas en el kiosko de tu stand.",
        steps: [
          "Abre el kiosko de tu stand y deja la pantalla lista.",
          "Pídele su PIN a cada visitante y escríbelo en el kiosko.",
          "Si se cae la conexión, sigue registrando: las visitas se envían cuando vuelve la red.",
          "Si algo no cuadra, avisa a tu administrador de stand.",
        ],
      },
      kof_admin: {
        summary: "Diriges el torneo de KOF.",
        steps: [
          "Abre el torneo de KOF y revisa las inscripciones y el check-in de los jugadores.",
          "Genera el bracket a la hora configurada: se arma una sola vez.",
          "Captura las semifinales y la final: solo tú las capturas.",
          "Apoya a las mesas: puedes capturar cualquier combate, congelar, descalificar o revertir un resultado.",
        ],
      },
      kof_staff: {
        summary: "Capturas los combates del tablero de tu mesa.",
        steps: [
          "Abre el torneo de KOF y ubica el tablero de tu mesa.",
          "Inicia cada combate de tu tablero cuando los dos jugadores estén listos.",
          "Al terminar, marca al perdedor; si un jugador no llega, marca No se presentó.",
          "Las semifinales y la final no son de tu mesa: las captura el administrador de KOF.",
        ],
      },
      raffle_admin: {
        summary: "Animas la rifa final del evento.",
        steps: [
          "Abre el panel de la rifa y espera la hora de inicio.",
          "Pulsa Girar: sale un boleto y la tómbola lo muestra en el escenario.",
          "Decide el boleto: Ganador si el visitante está presente, Descartado si no.",
          "Registra el premio de cada ganador y cierra la rifa cuando ya no queden boletos por decidir.",
        ],
      },
      help_desk: {
        summary: "Ayudas a los visitantes que perdieron el acceso a su pasaporte.",
        steps: [
          "Abre la mesa de recuperación en tu pantalla.",
          "Busca el pasaporte con el correo, el gamertag o el nombre completo del visitante.",
          "Confirma que es la persona: pídele su gamertag y cuántos stands ha visitado.",
          "Recupera el pasaporte y entrégale el enlace o el código QR nuevo: el teléfono anterior deja de funcionar.",
        ],
      },
    },
  },
  passwordVisibility: {
    show: "Mostrar contraseña",
    hide: "Ocultar contraseña",
  },
  activate: {
    title: "Activa tu cuenta",
    loading: "Revisando la invitación...",
    greeting: (name: string) => `Hola, ${name}. Elige una contraseña para entrar al panel del evento.`,
    passwordLabel: "Contraseña nueva",
    confirmationLabel: "Repite la contraseña",
    hint: (minimum: number) => `Mínimo ${minimum} caracteres.`,
    submit: "Activar cuenta",
    pending: "Activando...",
    goToLogin: "Ir a iniciar sesión",
    errors: {
      tooShort: (minimum: number) => `La contraseña necesita al menos ${minimum} caracteres.`,
      mismatch: "Las contraseñas no coinciden.",
      invalid: "Este enlace no es válido o ya se usó. Pide que te manden una invitación nueva.",
      expired: "Este enlace venció. Pide que te reenvíen la invitación.",
    },
  },
  invitationEmail: {
    subject: "Activa tu cuenta del evento",
    body: (name: string, link: string, roleLink: string) =>
      `Hola, ${name}.

Se creó una cuenta para ti en el panel del evento. Actívala con este enlace antes de que pasen 72 horas:
${link}

Lo que harás en el evento, tus pantallas y a quién acudir: ${roleLink}

Si no esperabas este correo, ignóralo.`,
  },
  management: {
    panel: {
      inviteHeading: "Invitar a alguien",
      nameLabel: "Nombre",
      emailLabel: "Correo",
      roleLabel: "Rol",
      deskLabel: "Mesa",
      deskOption: (desk: number) => `Mesa ${desk}`,
      submit: "Enviar invitación",
      sending: "Enviando...",
      empty: "Todavía no hay cuentas.",
      resend: "Reenviar invitación",
      disable: "Desactivar",
      reactivate: "Reactivar",
      reactivateHint: "Le llega una invitación nueva para elegir su contraseña.",
      confirmDisable: (name: string) => `¿Desactivar a ${name}? Dejará de poder entrar.`,
      confirmDisableAction: "Sí, desactivar",
      cancel: "Cancelar",
      statuses: { invited: "Invitación pendiente", active: "Activa", disabled: "Desactivada" },
      roles: {
        sysadmin: "Sysadmin",
        stand_admin: "Administrador de stand",
        stand_staff: "Staff de stand",
        kof_admin: "Administrador de KOF",
        raffle_admin: "Administrador de rifa",
        help_desk: "Atención",
        kof_staff: "Staff de KOF",
      },
      deskOf: (desk: number) => `Mesa ${desk}`,
      standLabel: "Stand",
      secondaryRole: {
        label: "Rol secundario",
        none: "Sin rol secundario",
        of: (role: string) => `Rol secundario: ${role}`,
        submit: "Guardar rol secundario",
        saving: "Guardando...",
      },
    },
    outcomes: {
      invited: "Invitación enviada.",
      resent: "Invitación reenviada.",
      disabled: "Cuenta desactivada.",
      reactivated: "Cuenta reactivada. Le llegó una invitación nueva para elegir su contraseña.",
      resetSent: "Enlace de restablecimiento enviado.",
      sessionsClosed: (count: number) => (count === 1 ? "Se cerró 1 sesión." : `Se cerraron ${count} sesiones.`),
      twoFactorCleared: (count: number) =>
        count === 1 ? "Se limpió 1 código pendiente." : `Se limpiaron ${count} códigos pendientes.`,
      secondaryRoleGranted: (role: string) => `Rol secundario asignado: ${role}.`,
      secondaryRoleRemoved: "Rol secundario quitado.",
    },
    errors: {
      nameRequired: "Escribe el nombre (máximo 80 caracteres).",
      emailInvalid: "Escribe un correo válido.",
      roleRequired: "Elige el rol.",
      deskInvalid: "La mesa es 1, 2, 3 o 4.",
      forbidden: "No puedes gestionar esta cuenta.",
      emailTaken: "Ese correo ya tiene una cuenta.",
      deskTaken: "Esa mesa ya tiene un staff. Desactívalo para reemplazarlo.",
      standFull: "El stand ya tiene 3 cuentas de staff. Desactiva una para dar de alta otra.",
      adminTaken: "El stand ya tiene un administrador. Desactívalo para reactivar a este.",
      standInvalid: "Elige el stand: solo las cuentas de stand lo llevan.",
      selfProtected: "No puedes desactivar tu propia cuenta.",
      lastSysadmin: "Es el último sysadmin activo: sin él nadie podría administrar el sistema.",
      secondaryRoleInvalid: "Elige un rol secundario de la lista.",
      notStandAdmin: "Solo un administrador de stand puede tener un rol secundario.",
      secondaryRoleUnchanged: "La cuenta ya tiene ese rol secundario.",
      notFound: "No se encontró la cuenta.",
      wrongState: "La cuenta no está en un estado que permita esto.",
    },
  },
} as const;
