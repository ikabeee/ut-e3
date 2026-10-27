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
} as const;
