"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Mostramos el banner mientras no haya una decisión guardada.
      if (!localStorage.getItem("pt_consent")) setShow(true);
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  if (!show) return null;

  function decide(value: "granted" | "denied") {
    try {
      localStorage.setItem("pt_consent", value);
    } catch {
      /* ignore */
    }
    // Si acepta, avisamos para que la analítica (GTM) cargue al momento.
    if (value === "granted") {
      try {
        window.dispatchEvent(new Event("pt-consent-granted"));
      } catch {
        /* ignore */
      }
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dcc4] bg-white/95 p-4 shadow-2xl backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-600">
          Usamos cookies <strong>técnicas necesarias</strong> para que el sitio funcione y, con tu permiso, cookies de{" "}
          <strong>analítica</strong> para entender cómo se usa la web.{" "}
          <Link href="/cookies" className="font-medium text-cyan-700 hover:underline">Más información</Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("denied")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => decide("granted")}
            className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
