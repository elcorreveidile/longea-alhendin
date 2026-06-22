import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import CookieSettings from "@/components/CookieSettings";

export const metadata: Metadata = {
  title: "Política de cookies · PlanTurnos",
  description: "Información sobre las cookies que utiliza PlanTurnos y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-bold text-slate-900">Política de cookies</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: junio de 2026</p>

        <div className="mt-8 space-y-6 text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc">
          <h2>¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos que un sitio web guarda en tu dispositivo para que funcione
            correctamente o para recordar información.
          </p>

          <h2>¿Qué cookies usamos?</h2>
          <ul>
            <li>
              <strong>Cookies técnicas / necesarias:</strong> imprescindibles para el funcionamiento del sitio y para
              mantener tu sesión iniciada cuando accedes a la aplicación. No requieren consentimiento.
            </li>
            <li>
              <strong>Cookies de preferencias:</strong> recuerdan elecciones como tu decisión sobre este aviso de
              cookies.
            </li>
            <li>
              <strong>Cookies de analítica:</strong> a través de <strong>Google Tag Manager</strong> y servicios de
              analítica de Google, nos ayudan a entender de forma agregada cómo se usa la web para mejorarla. Solo se
              activan <strong>si das tu consentimiento</strong>; si lo rechazas, no se cargan.
            </li>
          </ul>
          <p>
            La analítica <strong>nunca se carga sin tu permiso</strong>. Puedes cambiar tu decisión cuando quieras desde
            el botón <strong>«Configurar cookies»</strong> que encontrarás más abajo.
          </p>

          <h2>¿Cómo gestionar las cookies?</h2>
          <p>
            Puedes permitir, bloquear o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que
            desactivar las cookies técnicas puede impedir el correcto funcionamiento del acceso a la aplicación.
          </p>
          <p>Para revisar o cambiar tu consentimiento de analítica en esta web:</p>
          <CookieSettings />

          <h2>Más información</h2>
          <p>
            Consulta también nuestra <a href="/privacidad" className="text-cyan-700 underline">Política de privacidad</a>.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
