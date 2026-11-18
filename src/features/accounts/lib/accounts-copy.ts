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
      tooManyAttempts: "Demasiados intentos. Intenta de nuevo más tarde.",
    },
  },
  verifyCode: {
    title: "Verifica tu identidad",
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
      tooManyCodes: "Pediste demasiados códigos. Intenta de nuevo más tarde.",
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
    },
    outcomes: {
      invited: "Invitación enviada.",
      resent: "Invitación reenviada.",
      disabled: "Cuenta desactivada.",
      reactivated: "Cuenta reactivada. Le llegó una invitación nueva para elegir su contraseña.",
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
      standFull: "El stand ya tiene 3 cuentas de staff. Desactiva una para dar de alta otra.",
      adminTaken: "El stand ya tiene un administrador. Desactívalo para reactivar a este.",
      notFound: "No se encontró la cuenta.",
      wrongState: "La cuenta no está en un estado que permita esto.",
    },
  },
} as const;
