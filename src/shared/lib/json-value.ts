/** Valor que puede viajar por JSON, sin `undefined`, funciones ni instancias de clases. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}
