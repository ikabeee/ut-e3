export const ACCOUNTS_COPY = {
  signIn: {
    title: "Iniciar sesión",
    description: "Acceso del staff y de los administradores del evento.",
    emailLabel: "Correo",
    credentialLabel: "Contraseña",
    submit: "Entrar",
    pending: "Entrando...",
    errors: {
      missingFields: "Escribe tu correo y tu contraseña.",
      invalidCredentials: "Correo o contraseña incorrectos",
      tooManyAttempts: "Demasiados intentos. Intenta de nuevo más tarde.",
    },
  },
  signOut: "Cerrar sesión",
  activate: {
    title: "Activa tu cuenta",
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
    body: (name: string, link: string) =>
      `Hola, ${name}.

Se creó una cuenta para ti en el panel del evento. Actívala con este enlace antes de que pasen 72 horas:
${link}

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
    },
    outcomes: {
      invited: "Invitación enviada.",
      resent: "Invitación reenviada.",
      disabled: "Cuenta desactivada.",
    },
    errors: {
      nameRequired: "Escribe el nombre (máximo 80 caracteres).",
      emailInvalid: "Escribe un correo válido.",
      roleRequired: "Elige el rol.",
      deskInvalid: "La mesa es 1 o 2.",
      forbidden: "No puedes gestionar esta cuenta.",
      emailTaken: "Ese correo ya tiene una cuenta.",
      hasPassport: "Ese correo ya tiene un pasaporte de visitante; un staff no puede tenerlo.",
      deskTaken: "Esa mesa ya tiene un staff. Desactívalo para reemplazarlo.",
      notFound: "No se encontró la cuenta.",
      wrongState: "La cuenta no está en un estado que permita esto.",
    },
  },
} as const;
