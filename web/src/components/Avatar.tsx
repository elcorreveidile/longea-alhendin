// Avatar de trabajador: iniciales en un círculo de color estable (derivado del
// nombre). Inspirado en la app móvil de referencia. Sin dependencias ni fotos.

const COLORS = [
  "bg-rose-200 text-rose-800",
  "bg-amber-200 text-amber-800",
  "bg-emerald-200 text-emerald-800",
  "bg-sky-200 text-sky-800",
  "bg-violet-200 text-violet-800",
  "bg-cyan-200 text-cyan-800",
  "bg-pink-200 text-pink-800",
  "bg-indigo-200 text-indigo-800",
  "bg-teal-200 text-teal-800",
  "bg-orange-200 text-orange-800",
];

function cleanName(name: string): string {
  // Quita anotaciones tipo "(sup.)" para las iniciales.
  return name.replace(/\(.*?\)/g, "").trim();
}

function initials(name: string): string {
  const parts = cleanName(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? "");
  return (a + b).toUpperCase();
}

function colorFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${colorFor(name)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
