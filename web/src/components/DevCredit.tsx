"use client";

import { useState } from "react";

// Frases con guasa que cambian al pasar el ratón.
const PHRASES = [
  "Hecho con más café que presupuesto.",
  "Programado por 2 duros y mucho cariño.",
  "Menos Excel, más vida.",
  "Sí, lo ha hecho una sola persona.",
  "Si algo falla, era una feature.",
  "Cuadrantes sin lágrimas (casi).",
  "Optimiza turnos… y la siesta.",
  "Cero hojas de cálculo maltratadas.",
  "Tu cuadrante listo antes que el café.",
  "Funciona, y eso ya es mucho.",
  "Avalado por gerocultoras hartas de Excel.",
  "Barato, bonito y que cuadra.",
];

export default function DevCredit() {
  const [i, setI] = useState(0);

  function shuffle() {
    setI((prev) => {
      if (PHRASES.length < 2) return prev;
      let n = prev;
      while (n === prev) n = Math.floor(Math.random() * PHRASES.length);
      return n;
    });
  }

  return (
    <div className="mt-7 border-t border-slate-100 pt-4 text-center">
      <p
        onMouseEnter={shuffle}
        onClick={shuffle}
        title="Pásame el ratón 😏"
        className="cursor-default select-none text-xs italic text-slate-400 transition-colors hover:text-cyan-700"
      >
        “{PHRASES[i]}”
      </p>
      <p className="mt-1.5 text-xs text-slate-400">
        Desarrollo{" "}
        <a
          href="https://www.por2duros.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-500 hover:text-cyan-700 hover:underline"
        >
          Por 2 duros
        </a>{" "}
        💸
      </p>
    </div>
  );
}
