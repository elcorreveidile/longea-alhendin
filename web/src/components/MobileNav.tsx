"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS: [string, string][] = [
  ["/funcionalidades", "Funcionalidades"],
  ["/sectores", "Sectores"],
  ["/como-funciona", "Cómo funciona"],
  ["/precios", "Precios"],
  ["/demo", "Probar demo"],
  ["/blog", "Blog"],
  ["/preguntas-frecuentes", "Preguntas frecuentes"],
  ["/casos-de-exito", "Casos de éxito"],
  ["/sobre-nosotros", "Sobre nosotros"],
  ["/contacto", "Contacto"],
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7dcc4] bg-white text-slate-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-[#e7dcc4] bg-[#faf6ee] shadow-lg">
          <nav className="mx-auto flex max-w-6xl flex-col gap-0.5 px-5 py-3 text-sm">
            {LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-slate-700 hover:bg-white"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-cyan-700 px-3 py-2.5 text-center font-semibold text-white"
            >
              Acceder
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
