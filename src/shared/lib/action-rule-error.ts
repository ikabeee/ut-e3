/**
 * Lo lanzan las funciones de `*-queries.ts` cuando una regla de negocio impide la operación
 * (por ejemplo, pedir el boleto sin haber probado todos los juegos). Su mensaje se muestra
 * tal cual al usuario.
 */
export class ActionRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionRuleError";
  }
}
