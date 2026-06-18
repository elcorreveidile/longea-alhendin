import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Política de privacidad · PlanTurnos",
  description: "Política de privacidad y tratamiento de datos personales de PlanTurnos conforme al RGPD y la LOPDGDD.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-bold text-slate-900">Política de privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: junio de 2026</p>

        <div className="prose-legal mt-8 space-y-6 text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>Titular:</strong> Francisco Javier Benítez Láinez · <strong>NIF:</strong> 08916742X ·{" "}
            <strong>Domicilio:</strong> Calle María Magdalena, 5 · <strong>Contacto:</strong>{" "}
            <a href="/contacto" className="text-cyan-700 underline">formulario de contacto</a> ·{" "}
            <strong>Sitio web:</strong> planturnos.com
          </p>

          <h2>2. ¿Qué datos tratamos y con qué finalidad?</h2>
          <ul>
            <li><strong>Datos de contacto</strong> (nombre, correo, teléfono, empresa) que nos facilitas en el formulario, para atender tu solicitud o prueba.</li>
            <li><strong>Datos de acceso de los usuarios</strong> de la aplicación (nombre, correo o móvil) para permitir el inicio de sesión y mostrar su turno.</li>
            <li><strong>Datos laborales de la plantilla</strong> (puesto, turnos, vacaciones, foto opcional) que el cliente introduce para generar los cuadrantes.</li>
          </ul>

          <h2>3. Legitimación</h2>
          <p>
            El tratamiento se basa en tu <strong>consentimiento</strong> (formulario de contacto), en la{" "}
            <strong>ejecución de un contrato</strong> o relación de servicio, y en el <strong>interés legítimo</strong>{" "}
            de prestar y mejorar el servicio. Cuando el cliente trata datos de su personal a través de PlanTurnos,
            actúa como <strong>responsable</strong> y nosotros como <strong>encargado del tratamiento</strong>.
          </p>

          <h2>4. Conservación</h2>
          <p>
            Conservamos los datos mientras dure la relación y, después, durante los plazos legalmente exigibles. Los
            datos de contacto sin contratación se eliminan cuando dejan de ser necesarios.
          </p>

          <h2>5. Destinatarios</h2>
          <p>
            No cedemos datos a terceros salvo obligación legal. Usamos proveedores tecnológicos (alojamiento, envío de
            correo y SMS) que actúan como encargados con las debidas garantías.
          </p>

          <h2>6. Tus derechos</h2>
          <p>
            Puedes ejercer tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación y
            portabilidad</strong> a través de nuestro{" "}
            <a href="/contacto" className="text-cyan-700 underline">formulario de contacto</a>. También puedes reclamar
            ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" className="text-cyan-700 underline">aepd.es</a>).
          </p>

          <h2>7. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no
            autorizados, pérdida o alteración.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
