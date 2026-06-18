/** Conceptos de hora del profesorado (Acentos). "otro" admite texto libre. */
export const HOUR_CONCEPTS = [
  { value: "clase", label: "Clase" },
  { value: "prueba_nivel", label: "Prueba de nivel" },
  { value: "vigilancia_examen", label: "Vigilancia de examen" },
  { value: "tutoria", label: "Tutoría" },
  { value: "otro", label: "Otro" },
] as const;

export type HourConcept = (typeof HOUR_CONCEPTS)[number]["value"];

export function conceptLabel(value: string): string {
  return HOUR_CONCEPTS.find((c) => c.value === value)?.label ?? value;
}

/** Curso académico (oct–sept) al que pertenece una fecha. Devuelve el año de inicio. */
export function courseYearStart(d: Date): number {
  return d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1;
}

/** Rango ISO [inicio, fin] del curso académico que empieza en `startYear`. */
export function courseYearRange(startYear: number): { from: string; to: string } {
  return { from: `${startYear}-10-01`, to: `${startYear + 1}-09-30` };
}

export function courseYearLabel(startYear: number): string {
  return `${startYear}–${startYear + 1}`;
}
