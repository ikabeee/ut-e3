/** Lo lanzan las funciones de `*-queries.ts` cuando el registro a modificar ya no existe. */
export class RecordNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordNotFoundError";
  }
}
