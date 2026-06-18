"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("pt_cookies_ok")) setShow(true);
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  if (!show) return null;

  function accept() {
    try {
      localStorage.setItem("pt_cookies_ok", "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dcc4] bg-white/95 p-4 shadow-2xl backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-600">
          Usamos cookies técnicas necesarias para que el sitio funcione y para mantener tu sesión.{" "}
          <Link href="/cookies" className="font-medium text-cyan-700 hover:underline">Más información</Link>.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
