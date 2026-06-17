"use client";

import { useFormStatus } from "react-dom";

export default function GenerateButton({
  idle = "Generar mes",
  busy = "Generando… (unos segundos)",
}: {
  idle?: string;
  busy?: string;
} = {}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? busy : idle}
    </button>
  );
}
