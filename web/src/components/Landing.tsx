import Link from "next/link";
import DevCredit from "@/components/DevCredit";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold ${light ? "text-white" : "text-slate-800"}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-600 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </span>
      <span className="text-lg">Plan<span className={light ? "text-cyan-300" : "text-cyan-600"}>Turnos</span></span>
    </Link>
  );
}

// Mini-cuadrante de muestra para el hero.
const CELL: Record<string, string> = {
  M: "bg-emerald-100 text-emerald-800",
  T: "bg-amber-100 text-amber-800",
  N: "bg-indigo-200 text-indigo-900",
  D: "bg-slate-100 text-slate-400",
  V: "bg-sky-200 text-sky-800",
};
const MOCK: { name: string; row: string[] }[] = [
  { name: "Mónica", row: ["M", "M", "T", "D", "N", "N", "D"] },
  { name: "Rocío", row: ["T", "D", "M", "M", "T", "D", "M"] },
  { name: "Diana", row: ["M", "T", "D", "M", "M", "T", "D"] },
  { name: "Noemí", row: ["D", "T", "T", "N", "D", "M", "M"] },
  { name: "Sara", row: ["N", "N", "D", "T", "M", "M", "T"] },
];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];

function CuadranteMock() {
  return (
    <div className="rotate-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Julio · Residencia</span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Generado ✓</span>
      </div>
      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 text-[10px]">
        <div />
        {DOW.map((d, i) => (
          <div key={i} className="text-center font-semibold text-slate-400">{d}</div>
        ))}
        {MOCK.map((w) => (
          <div key={w.name} className="contents">
            <div className="pr-1 text-right font-medium text-slate-600">{w.name}</div>
            {w.row.map((c, i) => (
              <div key={i} className={`flex h-5 items-center justify-center rounded ${CELL[c]} font-bold`}>{c}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  { icon: "⚡", title: "Genera el mes en segundos", text: "El motor reparte mañanas, tardes y noches respetando las coberturas. Sin pelear con el Excel." },
  { icon: "✅", title: "Cumple el convenio", text: "Descanso de 36 h semanales, 12 h entre jornadas, máximos de días seguidos, domingos y vacaciones." },
  { icon: "📱", title: "Portal del trabajador", text: "Cada persona ve su turno en el móvil: hoy, mañana y el mes entero. Sin llamadas ni papeles." },
  { icon: "📤", title: "Exporta e imprime", text: "Descarga el cuadrante en Excel o PDF, con colores, listo para colgar o enviar." },
];

const STEPS = [
  { n: "1", title: "Carga tu plantilla", text: "Trabajadores, roles, restricciones y vacaciones." },
  { n: "2", title: "Pulsa «Generar mes»", text: "En segundos tienes el cuadrante completo y equilibrado." },
  { n: "3", title: "Reparte", text: "Cada trabajador entra con su código y ve su turno." },
];

const FAQ = [
  { q: "¿Cumple la normativa laboral?", a: "Sí. El motor respeta descansos (36 h semanales y 12 h entre turnos), máximos de días seguidos, domingos libres y vacaciones." },
  { q: "¿Mis trabajadores necesitan instalar algo?", a: "No. Entran desde el móvil con un código y un PIN, sin apps ni contraseñas complicadas." },
  { q: "¿Puedo probarlo antes de pagar?", a: "Sí, ofrecemos una prueba gratuita para que valores si encaja en tu centro." },
  { q: "¿Sirve para mi sector?", a: "Para cualquier equipo a turnos: residencias, clínicas, hostelería, seguridad, limpieza, industria…" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="flex items-center gap-5 text-sm">
            <a href="#precios" className="hidden text-slate-600 hover:text-cyan-700 sm:block">Precios</a>
            <a href="#faq" className="hidden text-slate-600 hover:text-cyan-700 sm:block">Preguntas</a>
            <Link href="/login" className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800">
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-cyan-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
              Ya en uso en residencias
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Los cuadrantes de tu equipo,{" "}
              <span className="text-cyan-700">listos en segundos</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              PlanTurnos genera los turnos automáticamente cumpliendo el convenio.
              Menos Excel, cero incumplimientos y cada trabajador ve su turno en el móvil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contacto" className="rounded-lg bg-cyan-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-cyan-800">
                Pruébalo gratis
              </Link>
              <a href="#como" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                Cómo funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">Sin permanencia · Listo para usar hoy mismo</p>
          </div>
          <div className="lg:pl-6">
            <CuadranteMock />
          </div>
        </div>
      </section>

      {/* Sectores */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-sm font-medium text-slate-500">Para cualquier equipo a turnos</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {["Residencias", "Clínicas", "Hostelería", "Seguridad", "Limpieza", "Industria"].map((t) => (
              <span key={t} className="rounded-full bg-white px-4 py-2 font-medium text-slate-700 shadow-sm">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Todo lo que necesitas, sin complicarte</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-slate-100 p-6 shadow-sm transition hover:shadow-md">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-800">{b.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-bold text-slate-900">En 3 pasos</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-xl font-bold text-white shadow">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cita */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="text-2xl font-medium leading-relaxed text-slate-800">
          “Hacer el cuadrante me llevaba <span className="text-cyan-700">medio día</span>. Ahora lo tengo en un par de minutos y sin errores.”
        </p>
        <p className="mt-4 text-sm text-slate-500">— Coordinadora de residencia</p>
      </section>

      {/* Precios */}
      <section id="precios" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center text-3xl font-bold text-slate-900">Precios sencillos</h2>
          <p className="mt-2 text-center text-slate-600">Elige pago mensual o compra única. Prueba gratis para empezar.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-cyan-600 bg-white p-7 shadow-sm">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">Recomendado</span>
              <h3 className="mt-3 text-xl font-bold text-slate-900">Suscripción</h3>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">49 €<span className="text-base font-medium text-slate-500">/mes por centro</span></p>
              <p className="text-sm text-slate-500">o 1,50 € por trabajador/mes</p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                <li>✓ Todo incluido (hosting, soporte, actualizaciones)</li>
                <li>✓ Sin pago inicial</li>
                <li>✓ Cancela cuando quieras</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Pago único</span>
              <h3 className="mt-3 text-xl font-bold text-slate-900">Compra</h3>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">1.297 €<span className="text-base font-medium text-slate-500"> única</span></p>
              <p className="text-sm text-slate-500">+ mantenimiento desde 29 €/mes</p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                <li>✓ La app en propiedad de uso</li>
                <li>✓ Mantenimiento opcional</li>
                <li>✓ Ideal si prefieres no pagar mensual</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">Precios + IVA. Prueba gratuita para valorar el ajuste a tu centro.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿Lo probamos en tu centro?</h2>
          <p className="mt-2 text-cyan-100">Te lo montamos y lo pruebas sin compromiso.</p>
          <Link
            href="/contacto"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50"
          >
            Escríbeme
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 text-center text-sm text-slate-500">
          <Logo />
          <DevCredit />
          <p className="mt-1 text-xs text-slate-400">© {new Date().getFullYear()} PlanTurnos · planturnos.com</p>
        </div>
      </footer>
    </div>
  );
}
