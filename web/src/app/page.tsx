import Cuadrante, { CuadranteData } from "@/components/Cuadrante";
import { SHIFTS } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";

export default function Home() {
  const data = sample as unknown as CuadranteData;
  const legend = ["M", "T", "N", "D", "V", "H", "HD"];

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-cyan-900">
            Cuadrantes · Residencia Alhendín (Teresa Montes)
          </h1>
          <p className="text-sm text-slate-500">
            Grupo Longea · Generador automático de turnos — prototipo
          </p>
        </header>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm">
            Este cuadrante de muestra lo ha <strong>generado el motor automático</strong>{" "}
            (OR-Tools) respetando: cobertura 9 mañana / 9 tarde / 2 noche todos los días,
            descansos legales, un domingo libre al mes, M.Mar solo L–V de mañana y las
            supervisoras con su patrón. La fila inferior comprueba la cobertura en vivo.
          </p>
        </section>

        {/* Leyenda */}
        <section className="flex flex-wrap gap-2">
          {legend.map((c) => {
            const def = SHIFTS[c];
            return (
              <span key={c} className={`rounded px-2 py-1 text-xs font-medium ${def.className}`}>
                <strong>{c}</strong> · {def.label}
              </span>
            );
          })}
        </section>

        <Cuadrante data={data} />

        {data.violations.length > 0 ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>{data.violations.length} aviso(s) de cobertura.</strong> Hay días en los
            que, con la plantilla actual, no se llega al mínimo de personal.
          </section>
        ) : (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            ✓ Cobertura cumplida los {data.days} días del mes.
          </section>
        )}
      </div>
    </main>
  );
}
