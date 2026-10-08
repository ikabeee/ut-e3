/** Información general del evento. Edita estos valores cuando se confirmen. */
export const EVENT_INFO = {
  name: "UT Game Showcase",
  tagline: "Los videojuegos creados por los estudiantes del edificio E3",
  date: "Por confirmar",
  location: "Edificio E3",
} as const;

export type EventInfo = typeof EVENT_INFO;
