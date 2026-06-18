import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Aviso legal · PlanTurnos",
  description: "Aviso legal y condiciones de uso del sitio web de PlanTurnos conforme a la LSSI-CE.",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-bold text-slate-900">Aviso legal</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: junio de 2026</p>

        <div className="mt-8 space-y-6 text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900">
          <h2>1. Datos identificativos</h2>
          <p>
            En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa de que este sitio web es titularidad de{" "}
            <strong>Francisco Javier Benítez Láinez</strong>, con NIF 08916742X y domicilio en Calle María Magdalena, 5.
            Puedes contactar a través de nuestro{" "}
            <a href="/contacto" className="text-cyan-700 underline">formulario de contacto</a>.
          </p>

          <h2>2. Objeto</h2>
          <p>
            Este sitio web ofrece información sobre PlanTurnos, una herramienta de gestión de cuadrantes y turnos, y
            permite el acceso a la aplicación a los usuarios autorizados.
          </p>

          <h2>3. Condiciones de uso</h2>
          <p>
            El usuario se compromete a hacer un uso lícito y adecuado del sitio y de la aplicación, y a no realizar
            actividades que puedan dañar, sobrecargar o deteriorar el servicio.
          </p>

          <h2>4. Propiedad intelectual e industrial</h2>
          <p>
            Los contenidos, marcas, logotipos y el software son propiedad de su titular o de terceros con licencia.
            Queda prohibida su reproducción o explotación sin autorización.
          </p>

          <h2>5. Responsabilidad</h2>
          <p>
            Se procura mantener el servicio disponible y la información actualizada, pero no se garantiza la ausencia
            de interrupciones o errores. El titular no será responsable de los daños derivados del uso del sitio.
          </p>

          <h2>6. Legislación aplicable</h2>
          <p>
            Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten
            a los juzgados y tribunales que correspondan conforme a derecho.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
