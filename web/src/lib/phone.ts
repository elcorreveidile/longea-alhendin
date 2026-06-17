/** Normaliza un teléfono a formato E.164 (p. ej. +34675823184). */
export function normalizePhone(input: string, defaultCountry = "+34"): string | null {
  if (!input) return null;
  let s = input.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) {
    return /^\+\d{8,15}$/.test(s) ? s : null;
  }
  // Sin prefijo: asumimos país por defecto (España: 9 dígitos).
  if (/^\d{9}$/.test(s)) return defaultCountry + s;
  return null;
}

/** Versión para mostrar (oculta dígitos centrales). */
export function maskPhone(e164: string): string {
  if (e164.length < 6) return e164;
  return e164.slice(0, 5) + "•••" + e164.slice(-2);
}
