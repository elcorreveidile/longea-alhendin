import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-700 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </span>
      <span className="text-lg">Plan<span className="text-cyan-700">Turnos</span></span>
    </Link>
  );
}

const BENEFITS = [
  { icon: "⚡", title: "Genera el mes en segundos", text: "El motor reparte mañanas, tardes y noches respetando las coberturas. Sin pelear con el Excel." },
  { icon: "✅", title: "Cumple el convenio", text: "Descanso de 36 h semanales, 12 h entre jornadas, máximos de días seguidos, domingos y vacaciones." },
  { icon: "📱", title: "Portal del trabajador", text: "Cada persona ve su turno en el móvil: hoy, mañana y el mes entero. Sin llamadas ni papeles." },
  { icon: "📤", title: "Exporta e imprime", text: "Descarga el cuadrante en Excel o PDF, con colores y listo para colgar o enviar." },
];

const STEPS = [
  { n: "1", title: "Carga tu plantilla", text: "Trabajadoras, roles, restricciones y vacaciones." },
  { n: "2", title: "Pulsa “Generar mes”", text: "En segundos tienes el cuadrante completo y equilibrado." },
  { n: "3", title: "Reparte", text: "Cada trabajador entra con su código y ve su turno." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="flex items-center gap-4 text-sm">
            <a href="#precios" className="hidden text-slate-600 hover:text-cyan-700 sm:block">Precios</a>
            <Link href="/login" className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800">
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-cyan-50 to-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
            Ya en uso en residencias
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Los cuadrantes de tu equipo,{" "}
            <span className="text-cyan-700">listos en segundos</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            PlanTurnos genera los turnos automáticamente cumpliendo el convenio.
            Menos Excel, cero incumplimientos y cada trabajador ve su turno en el móvil.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#precios" className="rounded-lg bg-cyan-700 px-6 py-3 font-semibold text-white hover:bg-cyan-800">
              Pruébalo gratis
            </a>
            <a href="#como" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-800">{b.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Para cualquier equipo a turnos</h2>
          <p className="mt-2 text-slate-600">Residencias, clínicas, hostelería, seguridad, limpieza, industria…</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
            {["Residencias", "Clínicas", "Hostelería", "Seguridad", "Limpieza", "Industria"].map((t) => (
              <span key={t} className="rounded-full bg-white px-4 py-2 font-medium text-slate-700 shadow-sm">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">Cómo funciona</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-700 text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center text-2xl font-bold text-slate-900">Precios sencillos</h2>
          <p className="mt-2 text-center text-slate-600">Elige pago mensual o compra única. Prueba gratis para empezar.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
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

      {/* CTA contacto */}
      <section id="contacto" className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">¿Lo probamos en tu centro?</h2>
        <p className="mt-2 text-slate-600">Te lo montamos y lo pruebas sin compromiso.</p>
        <a
          href="mailto:javier@blablaele.com?subject=Quiero%20probar%20PlanTurnos"
          className="mt-6 inline-block rounded-lg bg-cyan-700 px-8 py-3 font-semibold text-white hover:bg-cyan-800"
        >
          Escríbeme
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 text-center text-sm text-slate-500">
          <Logo />
          <p>
            Desarrollado por{" "}
            <a href="https://www.por2duros.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 hover:text-cyan-700 hover:underline">
              POR 2 DUROS
            </a>{" "}
            · planturnos.com
          </p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} PlanTurnos</p>
        </div>
      </footer>
    </div>
  );
}
