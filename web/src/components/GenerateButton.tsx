"use client";

import { useFormStatus } from "react-dom";

export default function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Generando… (unos segundos)" : "Generar mes"}
    </button>
  );
}
