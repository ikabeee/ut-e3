export const VISITORS_COPY = {
  genericRejection: "No se pudo registrar este correo",
  closed: (date: string) => `El registro se abre el ${date}.`,
  rateLimited: "Demasiados intentos. Intenta de nuevo más tarde.",
  errors: {
    fullNameRequired: "El nombre completo es obligatorio.",
    fullNameLength: "El nombre debe tener entre 3 y 80 caracteres.",
    gamertagRequired: "El gamertag es obligatorio.",
    gamertagLength: "El gamertag debe tener entre 3 y 20 caracteres.",
    gamertagFormat: "El gamertag solo puede contener letras, números, guiones y guiones bajos.",
    gamertagTaken: "Este gamertag ya está en uso.",
    emailRequired: "El correo es obligatorio.",
    emailInvalid: "Ingresa un correo electrónico válido.",
    closed: "El registro de visitantes aún no está abierto.",
  },
  form: {
    title: "Registro de visitantes",
    subtitle: "Crea tu pasaporte digital para el evento.",
    fullNameLabel: "Nombre completo",
    fullNamePlaceholder: "Tu nombre y apellido",
    gamertagLabel: "Gamertag",
    gamertagPlaceholder: "Tu apodo de jugador",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu-correo@ejemplo.com",
    submit: "Registrar pasaporte",
    pending: "Registrando...",
  },
  privacy: {
    shortNotice: "Al registrarte aceptas el",
    linkText: "aviso de privacidad",
    title: "Aviso de privacidad",
    pendingNotice: "El aviso de privacidad completo estará disponible próximamente.",
  },
  email: {
    subject: (gamertag: string) => `Tu pasaporte UT Game Showcase - ${gamertag}`,
    body: (pin: string, gamertag: string, passportUrl: string) =>
      `¡Hola, ${gamertag}!\n\nTu registro en UT Game Showcase ha sido exitoso.\nTu PIN de identidad es: ${pin}\n\nPuedes consultar tu pasaporte digital en el siguiente enlace:\n${passportUrl}\n\n¡Te esperamos en el evento!`,
  },
} as const;
