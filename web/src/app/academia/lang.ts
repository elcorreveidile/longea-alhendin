import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./content";

/** Idioma activo de la web pública (cookie). Por defecto, español. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "en" ? "en" : "es";
}
