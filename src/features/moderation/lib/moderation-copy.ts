export const MODERATION_COPY = {
  alerts: {
    heading: "Alertas de posible fraude",
    thresholds: (count: number, minutes: number, maxVisits: number) =>
      `Umbrales: ${count} visitas con 5 en las tres calificaciones dentro de ${minutes} minutos en un stand; visitantes con ${maxVisits} check-in(s) o menos. Se cambian en Configuración.`,
    burstsHeading: "Stands con muchas calificaciones de 5",
    burstsEmpty: "Ningún stand supera el umbral.",
    burst: (code: string, count: number) => `${code}: ${count} calificaciones de 5`,
    burstLapse: (from: string, to: string) => `entre las ${from} y las ${to}`,
    fewStandHeading: "Visitantes que solo visitaron pocos stands",
    fewStandEmpty: "Ningún visitante está en este caso.",
    fewStandVisitor: (gamertag: string, count: number) => `${gamertag}: ${count} check-in(s)`,
    fewStandMore: (shown: number, total: number) => `Se muestran ${shown} de ${total}.`,
    review: "Revisar",
  },
  lookup: {
    heading: "Anular visitas y excluir visitantes",
    lead: "Busca por PIN, gamertag o correo. Nada se borra: la visita o el visitante quedan marcados con su motivo.",
    label: "PIN, gamertag o correo",
    submit: "Buscar",
    notFound: "No hay ningún pasaporte con ese dato.",
  },
  visitor: {
    summary: (count: number) => `${count} visita(s) válidas`,
    excluded: (reason: string) => `Excluido: ${reason}`,
    checkInsHeading: "Visitas",
    noCheckIns: "Sin visitas.",
    ticketsHeading: "Boletos",
    noTickets: "Sin boletos.",
    ticket: (number: number, milestone: number) => `Boleto #${number} (hito ${milestone})`,
    ticketStatus: (status: string) => {
      if (status === "active") return "activo";

      if (status === "voided") return "anulado";

      return status === "drawn" ? "sorteado" : status;
    },
    annulled: (reason: string, byName: string) => `Anulada por ${byName}: ${reason}`,
  },
  forms: {
    reason: "Motivo",
    reasonHint: "De 5 a 280 caracteres. Queda en la bitácora.",
    annul: "Anular visita",
    annulConfirm: "Confirmar anulación",
    exclude: "Excluir visitante",
    excludeConfirm: "Confirmar exclusión",
    pending: "Guardando...",
  },
  outcomes: {
    annulled: "Visita anulada.",
    annulledVoided: (milestones: number[]) =>
      `Visita anulada. Boleto(s) del hito ${milestones.join(" y ")} anulado(s).`,
    annulledFrozen: "Visita anulada. La rifa ya empezó, así que los boletos no cambian.",
    excluded: "Visitante excluido. Sus boletos quedan fuera de la rifa.",
  },
  errors: {
    reasonLength: "Escribe un motivo de 5 a 280 caracteres, con letras o números.",
    notFound: "Ya no existe. Recarga la página.",
    alreadyAnnulled: "Esa visita ya estaba anulada.",
    alreadyExcluded: "Ese visitante ya estaba excluido.",
  },
} as const;
