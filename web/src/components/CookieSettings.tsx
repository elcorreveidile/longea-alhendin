"use client";

/** Botón para revisar la decisión de cookies: borra el consentimiento y
 *  recarga, de modo que el banner vuelve a aparecer para elegir de nuevo. */
export default function CookieSettings() {
  function reset() {
    try {
      localStorage.removeItem("pt_consent");
    } catch {
      /* ignore */
    }
    location.reload();
  }
  return (
    <button
      onClick={reset}
      className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
    >
      Configurar cookies
    </button>
  );
}
