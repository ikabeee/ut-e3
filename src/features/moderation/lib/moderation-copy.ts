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
    viewVisitors: (count: number) => `Ver visitantes (${count})`,
  },
  selection: {
    legend: "Visitas del intervalo",
    selectAll: "Seleccionar todas",
    row: (gamertag: string, email: string, time: string) => `${gamertag} · ${email} · ${time}`,
    ratings: (game: number, stand: number, art: number) => `Juego ${game} · Stand ${stand} · Arte ${art}`,
    selected: (count: number) => `${count} seleccionada(s)`,
    annul: "Anular visitas seleccionadas",
    exclude: "Excluir a los visitantes seleccionados",
    reasonHint: "Un motivo para todas, de 5 a 280 caracteres. Queda en la bitácora de cada una.",
  },
  byStand: {
    heading: "Por stand",
    lead: "Elige un stand para ver todas sus visitas, quién las registró y sus calificaciones.",
    label: "Stand",
    placeholder: "Elige un stand",
    submit: "Ver visitas",
    empty: "Este stand no tiene visitas.",
    summary: (count: number) => `${count} visita(s)`,
    exportCsv: "Exportar CSV",
    columns: {
      gamertag: "Gamertag",
      time: "Hora",
      recordedBy: "Registró",
      ratings: "Calificaciones",
      status: "Estado",
    },
    notRecorded: "Sin dato",
    noVote: "Sin calificar",
    status: { valid: "Válida", annulled: "Anulada", excluded: "Visitante excluido" },
    truncated: (limit: number) => `Se muestran las primeras ${limit} visitas.`,
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
    bulkAnnulled: (done: number, skipped: number) =>
      skipped > 0
        ? `${done} visita(s) anulada(s). ${skipped} ya no se podían anular.`
        : `${done} visita(s) anulada(s).`,
    bulkExcluded: (done: number, skipped: number) =>
      skipped > 0
        ? `${done} visitante(s) excluido(s). ${skipped} ya estaban excluidos.`
        : `${done} visitante(s) excluido(s).`,
  },
  errors: {
    nothingSelected: "Marca al menos una visita.",
    nothingChanged: "Ninguna de las marcadas se pudo cambiar: ya estaban anuladas o excluidas. Recarga la página.",
    reasonLength: "Escribe un motivo de 5 a 280 caracteres, con letras o números.",
    notFound: "Ya no existe. Recarga la página.",
    alreadyAnnulled: "Esa visita ya estaba anulada.",
    alreadyExcluded: "Ese visitante ya estaba excluido.",
  },
} as const;
