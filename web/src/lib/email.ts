import "server-only";
import { Resend } from "resend";
import { emailFrom, resendApiKey, contactEmail } from "./env";

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));

/** Envía un mensaje del formulario de contacto al buzón configurado. */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  org?: string;
  message: string;
}): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    console.log("[email] (sin RESEND_API_KEY) contacto:", data);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: contactEmail(),
    replyTo: data.email,
    subject: `PlanTurnos · Contacto de ${data.name}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0e7490">Nuevo mensaje desde PlanTurnos</h2>
        <p><strong>Nombre:</strong> ${esc(data.name)}</p>
        <p><strong>Correo:</strong> ${esc(data.email)}</p>
        ${data.org ? `<p><strong>Centro/Empresa:</strong> ${esc(data.org)}</p>` : ""}
        <p><strong>Mensaje:</strong></p>
        <p style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px">${esc(data.message)}</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    // En desarrollo sin Resend configurado: log para poder copiar el enlace.
    console.log(`[email] (sin RESEND_API_KEY) Magic link para ${email}: ${url}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: email,
    subject: "Tu acceso a Cuadrantes · Residencia Alhendín",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0e7490">Acceso a Cuadrantes</h2>
        <p>Has solicitado acceder a la aplicación de cuadrantes de la Residencia Alhendín.</p>
        <p style="margin:28px 0">
          <a href="${url}" style="background:#0e7490;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
            Entrar
          </a>
        </p>
        <p style="color:#64748b;font-size:13px">
          Este enlace caduca en 15 minutos y solo puede usarse una vez.
          Si no has sido tú, ignora este correo.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}
